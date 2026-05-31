import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Testing connection to MongoDB...');

try {
  await mongoose.connect(uri);
  console.log('Successfully connected to MongoDB with standard options!');
  process.exit(0);
} catch (err) {
  console.error('Failed with standard options:', err.message);
  
  try {
    console.log('Attempting IPv4 force (family: 4)...');
    await mongoose.connect(uri, { family: 4 });
    console.log('Successfully connected to MongoDB using IPv4!');
    process.exit(0);
  } catch (err2) {
    console.error('Failed with family:4 as well:', err2.message);
    
    try {
      console.log('Attempting direct connection string...');
      const directUri = 'mongodb://yasirh791:yasirhasan1@ac-p9b7y6v-shard-00-00.vzin0bf.mongodb.net:27017,ac-p9b7y6v-shard-00-01.vzin0bf.mongodb.net:27017,ac-p9b7y6v-shard-00-02.vzin0bf.mongodb.net:27017/railwise?ssl=true&replicaSet=atlas-13c5q9-shard-0&authSource=admin&retryWrites=true&w=majority';
      await mongoose.connect(directUri);
      console.log('Successfully connected to MongoDB using Direct URI!');
      process.exit(0);
    } catch (err3) {
      console.error('Failed direct URI:', err3.message);
      process.exit(1);
    }
  }
}
