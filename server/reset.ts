import { RecordStore } from "./db";
import { resetDemo } from "./seed";

const store = new RecordStore(process.env.DB_FILE ?? "data/demo.db");
const records = resetDemo(store);
store.close();
console.log(`Demo data reset: ${records.length} synthetic records loaded.`);
