# Deploy Firestore Security Rules

คู่มือนี้ใช้ deploy ไฟล์ [`firestore.rules`](../../firestore.rules) ของ
โปรเจกต์ไปยัง Firebase project ที่ถูกต้อง โดย rules นี้มีหลักการดังนี้:

- ผู้ใช้ที่ล็อกอินแล้วอ่าน `markets/default` ได้
- เขียนข้อมูลได้เฉพาะผู้ที่มี `admins/<UID>` และมี `role: "admin"`
- browser code ไม่สามารถสร้างหรือเปลี่ยนบทบาท admin ได้

## สิ่งที่ต้องเตรียม

1. สร้าง Firebase project และเปิด Firestore (Native/Standard mode)
2. เปิด **Authentication → Sign-in method → Email/Password**
3. สร้างบัญชี admin แรกใน **Authentication → Users** และยืนยันอีเมล
4. คัดลอก UID ของบัญชีนั้น แล้วสร้างเอกสารนี้จาก Firestore Console:

   - Collection: `admins`
   - Document ID: `<ADMIN_UID>`
   - Field: `role` (string) = `admin`

การสร้าง admin document ผ่าน Console ทำได้แม้ rules ที่ deploy แล้วจะไม่
อนุญาต client เขียน collection นี้ และต้องทำก่อนให้ผู้ใช้รายนั้น Save map ได้

## ตั้งค่า Firebase CLI

รันจาก root ของ repository:

```bash
npx -y firebase-tools@latest --version
npx -y firebase-tools@latest login
```

หาก shell เปิด browser ไม่ได้ ให้ใช้:

```bash
npx -y firebase-tools@latest login --no-localhost
```

## ตรวจการผูก Firebase CLI

repository นี้ตั้งค่าไว้แล้ว:

- `firebase.json` ชี้ `firestore.rules` และ Firestore database `(default)`
- `.firebaserc` เลือก project `market-stall-88014`

ก่อน deploy ให้ตรวจว่าทั้งสองค่ายังเป็น Firebase project ที่ต้องการ:

```bash
npx -y firebase-tools@latest use
```

หากต้องการสลับไป project อื่น ให้รัน:

```bash
npx -y firebase-tools@latest use --add
```

เลือก existing Firebase project ที่ถูกต้อง คำสั่งนี้จะอัปเดต `.firebaserc`
ซึ่งมีเพียง project alias/ID และสามารถ commit ได้

## Deploy

วิธีที่ชัดเจนที่สุดคือระบุ project ID โดยตรง:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

หากตั้ง active project ด้วย `firebase use --add` แล้ว ใช้ได้ดังนี้:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```

deploy เฉพาะ `firestore:rules` จะไม่กระทบ Hosting, Functions หรือ Firebase
service อื่น ๆ

## ตรวจหลัง deploy

1. ไปที่ **Firebase Console → Firestore Database → Rules** และตรวจว่า
   publish time เปลี่ยนเป็นเวลาล่าสุด
2. ล็อกอินด้วย admin account แล้วเปิด Market Map, เข้า Edit Mode, Save และ
   refresh หน้าเพื่อยืนยันว่า `markets/default` เขียนและอ่านได้
3. ล็อกอินด้วยบัญชีที่ไม่มี `admins/<UID>` แล้วตรวจว่าเข้าดู map ได้ แต่ปุ่ม
   Edit Mode ถูกปิด และการเขียนตรงไป Firestore ถูกปฏิเสธด้วย
   `permission-denied`
4. ตรวจว่าไม่มี client ใดสร้างหรือแก้ `admins/<UID>` ได้

## ปัญหาที่พบบ่อย

### `Failed to authenticate`

รัน `npx -y firebase-tools@latest login` ใหม่ หรือใช้ `login --no-localhost`
หาก environment เปิด browser ไม่ได้

### `No project active` หรือ deploy ไปผิด project

ใช้ `--project YOUR_FIREBASE_PROJECT_ID` กับคำสั่ง deploy หรือรัน
`npx -y firebase-tools@latest use --add` เพื่อเลือก project ใหม่

### `Error: Not in a Firebase app directory`

ตรวจว่ารันคำสั่งจาก repository root และมี `firebase.json`

### Admin ล็อกอินได้ แต่ Save ได้ `permission-denied`

ตรวจสามอย่าง:

1. Document ID ใน `admins/<UID>` ตรงกับ Firebase Authentication UID ของคนที่
   ล็อกอิน—not the email address
2. field `role` เป็น string ค่า `admin` ตัวพิมพ์เล็ก
3. rules เวอร์ชันล่าสุดถูก deploy ไปยัง Firebase project เดียวกับค่า
   `VITE_FIREBASE_PROJECT_ID`

## References

- [Firebase CLI documentation](https://firebase.google.com/docs/cli)
- [Cloud Firestore Security Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase email/password authentication](https://firebase.google.com/docs/auth/web/password-auth)
