import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSignUp = async () => {
    // 1. تسجيل المستخدم
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return alert(error.message)

    const newUser = data.user
    let avatarUrl = null

    // 2. رفع الصورة لو فيه ملف
    if (avatarFile && newUser) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${newUser.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars') // اسم البكت اللي أنشأناه
        .upload(fileName, avatarFile, { upsert: true })

      if (uploadError) {
        console.error(uploadError)
        alert('حصل خطأ أثناء رفع الصورة')
      } else {
        // رابط الصورة
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        avatarUrl = publicUrlData.publicUrl
      }
    }

    // 3. حفظ البيانات في profiles
    if (newUser) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: newUser.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          phone
        }])
      if (profileError) console.error(profileError)
      else alert('تم إنشاء الحساب وحفظ البيانات')
    }
  }

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>🔐 Auth</h2>

      {user ? (
        <>
          <p>مرحبًا، {user.email}</p>
          <button onClick={handleSignOut}>تسجيل خروج</button>
        </>
      ) : (
        <>
          <input placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input placeholder="رقم التليفون" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
          <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleSignIn}>تسجيل دخول</button>
            <button onClick={handleSignUp} style={{ marginLeft: '10px' }}>تسجيل جديد</button>
          </div>
        </>
      )}
    </div>
  )
}