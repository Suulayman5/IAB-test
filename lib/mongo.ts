import { MongoClient } from 'mongodb';

declare global {
  namespace NodeJS {
    interface GlobalThis {
      _mongoClientPromise?: Promise<MongoClient>;
    }
  }
}

const uri = process.env.MONGODB_URI!;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (!(globalThis as NodeJS.GlobalThis)._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalThis._mongoClientPromise = client.connect();
}
clientPromise = globalThis._mongoClientPromise;

export default clientPromise;