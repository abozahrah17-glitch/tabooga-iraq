import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBufUYfdNHokPzKgVFJFx9wnrGoHPp0mqY",
  authDomain: "taboogaapp.firebaseapp.com",
  projectId: "taboogaapp",
  storageBucket: "taboogaapp.firebasestorage.app",
  messagingSenderId: "39860206443",
  appId: "1:39860206443:web:bc9ae972e8fab7f5252a2e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose to window for other scripts to use
window.firebaseAuth = auth;
window.firebaseDb = db;

let confirmationResult = null;

// Initialize Recaptcha
function initRecaptcha() {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved
            }
        });
    }
}

// Send OTP
window.sendOTP = async function() {
    const phoneNumber = document.getElementById('phoneNumberInput').value.trim();
    if (!phoneNumber) {
        Swal.fire('خطأ', 'الرجاء إدخال رقم الهاتف', 'error');
        return;
    }
    
    // Format number to international if needed
    let formattedNumber = phoneNumber;
    if (formattedNumber.startsWith('0')) {
        formattedNumber = '+964' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('+')) {
        formattedNumber = '+964' + formattedNumber;
    }

    try {
        initRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        
        // Show loading state
        document.getElementById('sendOtpBtn').disabled = true;
        document.getElementById('sendOtpBtn').innerText = 'جاري الإرسال...';
        
        confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
        
        // Show OTP section
        document.getElementById('phoneInputSection').style.display = 'none';
        document.getElementById('otpInputSection').style.display = 'block';
        Swal.fire('تم الإرسال', 'تم إرسال رمز التحقق إلى هاتفك', 'success');
        
    } catch (error) {
        console.error("Error during sendOTP:", error);
        let msg = 'حدث خطأ أثناء إرسال الرمز: ' + (error.message || error);
        if (error.code === 'auth/invalid-phone-number') msg = 'رقم الهاتف غير صالح، تأكد من كتابة الرقم الصحيح.';
        Swal.fire('خطأ', msg, 'error');
        
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
    } finally {
        document.getElementById('sendOtpBtn').disabled = false;
        document.getElementById('sendOtpBtn').innerText = 'إرسال الرمز';
    }
};

// Verify OTP
window.verifyOTP = async function() {
    const code = document.getElementById('otpCodeInput').value.trim();
    if (!code) {
        Swal.fire('خطأ', 'الرجاء إدخال الرمز', 'error');
        return;
    }

    try {
        document.getElementById('verifyOtpBtn').disabled = true;
        document.getElementById('verifyOtpBtn').innerText = 'جاري التحقق...';
        
        const result = await confirmationResult.confirm(code);
        const user = result.user;
        
        // Save user to Firestore
        await setDoc(doc(db, "users", user.uid), {
            phoneNumber: user.phoneNumber,
            lastLogin: serverTimestamp(),
            status: 'active' // admin can change this to 'blocked'
        }, { merge: true });
        
        document.getElementById('auth-overlay').style.display = 'none';
        Swal.fire('مرحباً', 'تم تسجيل الدخول بنجاح', 'success');
        
    } catch (error) {
        console.error("Error during verifyOTP:", error);
        Swal.fire('خطأ', 'الرمز غير صحيح أو منتهي الصلاحية', 'error');
    } finally {
        document.getElementById('verifyOtpBtn').disabled = false;
        document.getElementById('verifyOtpBtn').innerText = 'تأكيد';
    }
};

// Logout
window.logoutUser = async function() {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

// Listen to Auth State
onAuthStateChanged(auth, async (user) => {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'none'; // Always bypass the UI overlay
    }
    
    if (user) {
        // User is signed in
        // Check if user is blocked in Firestore
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().status === 'blocked') {
                await signOut(auth);
                Swal.fire('حساب محظور', 'لقد تم حظر حسابك من قبل الإدارة', 'error');
                if (overlay) overlay.style.display = 'flex';
                return;
            }
        } catch (e) {
            console.error("Error checking user status:", e);
        }
    } else {
        // User is signed out, automatically sign in anonymously so Firebase rules don't block
        try {
            await signInAnonymously(auth);
            console.log("Signed in anonymously");
        } catch (error) {
            console.error("Anonymous auth failed:", error);
        }
    }
});

// Admin Panel Logic
window.openAdminPanel = async function() {
    const adminModal = document.getElementById('adminModal');
    if(adminModal) adminModal.classList.remove('hidden');
    
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = document.getElementById('adminSubscribersList');
        if(!usersList) return;
        
        usersList.innerHTML = '';
        let totalUsers = 0;
        
        querySnapshot.forEach((docSnap) => {
            totalUsers++;
            const userData = docSnap.data();
            const uid = docSnap.id;
            
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.padding = '15px';
            div.style.background = 'white';
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="text-align:right;">
                        <strong style="color:black;">${userData.phoneNumber || 'بدون رقم'}</strong>
                        <div style="font-size:0.8rem; color:${userData.status === 'blocked' ? 'red' : 'green'};">${userData.status === 'blocked' ? 'محظور' : 'نشط'}</div>
                    </div>
                    <button onclick="window.toggleUserStatus('${uid}', '${userData.status}')" style="background:${userData.status === 'blocked' ? '#10B981' : '#EF4444'}; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">
                        ${userData.status === 'blocked' ? 'تفعيل' : 'حظر'}
                    </button>
                </div>
            `;
            usersList.appendChild(div);
        });
        
        const totalUsersStat = document.getElementById('totalUsersStat');
        if(totalUsersStat) totalUsersStat.innerText = totalUsers;
        
    } catch(e) {
        console.error("Error loading users", e);
        Swal.fire('تنبيه', 'لا تملك الصلاحية الكافية أو حدث خطأ في جلب المستخدمين.', 'warning');
    }
};

window.toggleUserStatus = async function(uid, currentStatus) {
    try {
        const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
        await updateDoc(doc(db, "users", uid), {
            status: newStatus
        });
        Swal.fire('تم', 'تم تغيير حالة المستخدم بنجاح', 'success');
        window.openAdminPanel(); // Refresh list
    } catch(e) {
        console.error(e);
        Swal.fire('خطأ', 'حدث خطأ أثناء تعديل الحالة', 'error');
    }
};
