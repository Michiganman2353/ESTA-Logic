// components/firebase/index.js
import firebase from './firebase';
import firebaseContext, { usefirebase, withfirebase } from './context';

// Default: firebase instance (for legacy)
export default firebase;

// Named exports
export { firebaseContext, usefirebase, withfirebase };