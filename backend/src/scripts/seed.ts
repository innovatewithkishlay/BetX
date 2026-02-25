import { auth, db } from '../config/firebase';

const seedInitialAgent = async () => {
    const email = 'agent@betx.com';
    const password = 'Agent@123';

    try {
        console.log(`Checking if user ${email} exists...`);
        let user;
        try {
            user = await auth.getUserByEmail(email);
            console.log('User already exists in Firebase Auth.');
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                console.log('Creating user in Firebase Auth...');
                user = await auth.createUser({
                    email,
                    password,
                    displayName: 'Initial Agent',
                });
                console.log('User created successfully:', user.uid);
            } else {
                throw err;
            }
        }

        console.log('Syncing user to Firestore...');
        await db.collection('users').doc(user.uid).set({
            email,
            role: 'agent',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        }, { merge: true });

        console.log('✅ Initial agent seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedInitialAgent();
