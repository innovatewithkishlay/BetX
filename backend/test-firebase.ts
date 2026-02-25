// Quick Firebase Admin SDK connection test
// Run with: npx ts-node test-firebase.ts

import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

async function testFirebaseConnection() {
    console.log('\n🔥 Testing Firebase Admin SDK connection...\n');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    console.log(`  Project ID    : ${projectId}`);
    console.log(`  Client Email  : ${clientEmail}`);
    console.log(`  Private Key   : ${privateKey ? '✅ Present' : '❌ Missing'}`);
    console.log('');

    if (!projectId || !privateKey || !clientEmail) {
        console.error('❌ Missing credentials in .env file!');
        process.exit(1);
    }

    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
            });
        }

        console.log('✅ Firebase Admin SDK initialized successfully!');

        // Test Firestore connection by listing collections
        const db = admin.firestore();
        const collections = await db.listCollections();
        console.log(`\n✅ Firestore connected! Found ${collections.length} collection(s):`);
        collections.forEach((col) => console.log(`   - ${col.id}`));

        // Test Auth service
        try {
            const listResult = await admin.auth().listUsers(1);
            console.log(`\n✅ Firebase Auth connected! Total users (sample): ${listResult.users.length}`);
        } catch (authErr) {
            console.log('\n⚠️  Auth check skipped (no permissions or no users yet)');
        }

        console.log('\n🎉 Firebase connection is WORKING!\n');
        process.exit(0);
    } catch (err: any) {
        console.error('\n❌ Firebase connection FAILED!');
        console.error('   Error:', err.message);
        process.exit(1);
    }
}

testFirebaseConnection();
