import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
} from "firebase/auth";
import { app, db, storage } from "./config.shared";

export { app, db, storage };
export default app;

let _auth;
try {
  _auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
} catch {
  _auth = getAuth(app);
}
export const auth = _auth;
