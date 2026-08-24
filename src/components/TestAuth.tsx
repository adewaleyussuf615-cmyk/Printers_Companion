import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function TestAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testSignup = async () => {
    setLoading(true)
    setResult('Testing signup...')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      setResult(`❌ Error: ${error.message}`)
    } else {
      setResult(`✅ Success! User created: ${data.user?.email}\nUser ID: ${data.user?.id}`)
    }
    setLoading(false)
  }

  const testSignin = async () => {
    setLoading(true)
    setResult('Testing signin...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setResult(`❌ Error: ${error.message}`)
    } else {
      setResult(`✅ Success! Signed in as: ${data.user?.email}`)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>🔧 Auth Test</h2>
      <p>Use a <strong>new email</strong> for testing</p>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '8px 0' }}
          placeholder="test@example.com"
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '8px 0' }}
          placeholder="password"
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button onClick={testSignup} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Sign Up
        </button>
        <button onClick={testSignin} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Sign In
        </button>
      </div>
      {result && (
        <pre style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
          {result}
        </pre>
      )}
    </div>
  )
}
