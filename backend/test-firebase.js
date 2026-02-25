const admin = require('firebase-admin');
require('dotenv').config();

async function test() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    console.log('\n🔥 Firebase Connection Test');
    console.log('----------------------------');
    console.log('Project ID   :', projectId);
    console.log('Client Email :', clientEmail);
    console.log('Private Key  :', privateKey ? '✅ Present' : '❌ Missing');

    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
            });
        }
        console.log('\n✅ Firebase Admin SDK initialized!');

        const db = admin.firestore();
        const cols = await db.listCollections();
        console.log('✅ Firestore connected! Collections found:', cols.length);
        cols.forEach(c => console.log('   -', c.id));

        const auth = admin.auth();
        const result = await auth.listUsers(1);
        console.log('✅ Firebase Auth connected! Sample user count:', result.users.length);

        console.log('\n🎉 ALL GOOD — Firebase is connected!\n');
    } catch (e) {
        console.error('\n❌ Connection FAILED!');
        console.error('Error code   :', e.code);
        console.error('Error message:', e.message);
        process.exit(1);
    }
}

test();
