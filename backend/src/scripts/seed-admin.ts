import { auth, db } from '../config/firebase';

const seedAdmin = async () => {
    const email = 'admin@betx.com';
    const password = 'Admin@123';

    try {
        console.log(`Checking if admin ${email} exists...`);
        let user;
        try {
            user = await auth.getUserByEmail(email);
            console.log('Admin user already exists in Firebase Auth.');
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                console.log('Creating admin user in Firebase Auth...');
                user = await auth.createUser({
                    email,
                    password,
                    displayName: 'System Administrator',
                });
                console.log('Admin created successfully:', user.uid);
            } else {
                throw err;
            }
        }

        console.log('Syncing admin to Firestore...');
        await db.collection('users').doc(user.uid).set({
            email,
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        }, { merge: true });

        console.log('✅ Admin user seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedAdmin();
