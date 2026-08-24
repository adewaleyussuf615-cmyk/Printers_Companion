import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isKeysConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
)

export const isSupabaseConfigured = isKeysConfigured;

let supabaseClientInstance: any;

if (isKeysConfigured) {
  supabaseClientInstance = createClient(supabaseUrl!, supabaseAnonKey!)
} else {
  console.warn('⚠️ Supabase environment variables are missing or not configured. Printers Companion is running in Offline/Demo mode using localStorage fallback.')
  
  // Initialize mock database in localStorage
  const getStorageItem = (key: string, defaultValue: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const setStorageItem = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  };

  // Seed default stocks if empty (multi-merchant listings to enable price intelligence)
  const defaultStocks = [
    {
      id: 'stock-1',
      name: 'Gloss Art Paper',
      gsm: 150,
      size: '700×1000mm',
      price: 18500,
      quantity: 150,
      merchant_name: 'Premium Paper Co',
      merchant_id: 'merchant-demo',
      merchant_rating: 4.8,
      delivery: 'Yes',
      description: 'High gloss double coated art paper, ideal for brochures, magazines, and calendars.',
      created_at: new Date().toISOString()
    },
    {
      id: 'stock-1-alt1',
      name: 'Gloss Art Paper',
      gsm: 150,
      size: '700×1000mm',
      price: 17900,
      quantity: 12, // Low stock -> "Only 12 available"
      merchant_name: 'Express Forms Paper',
      merchant_id: 'merchant-alt-1',
      merchant_rating: 4.2,
      delivery: 'No',
      description: 'Imported gloss art paper. Fast clearance sales.',
      created_at: new Date().toISOString()
    },
    {
      id: 'stock-1-alt2',
      name: 'Gloss Art Paper',
      gsm: 150,
      size: '700×1000mm',
      price: 19400,
      quantity: 400,
      merchant_name: 'Elite Boards Ltd',
      merchant_id: 'merchant-alt-2',
      merchant_rating: 4.6,
      delivery: 'Yes',
      description: 'Superb print run gloss paper with consistent runnability.',
      created_at: new Date().toISOString()
    },
    {
      id: 'stock-2',
      name: 'Matt Art Board',
      gsm: 300,
      size: '700×1000mm',
      price: 32000,
      quantity: 80,
      merchant_name: 'Elite Boards Ltd',
      merchant_id: 'merchant-demo',
      merchant_rating: 4.6,
      delivery: 'Yes',
      description: 'Premium silk matt art board, perfect for business cards, book covers, and luxury packaging.',
      created_at: new Date().toISOString()
    },
    {
      id: 'stock-2-alt1',
      name: 'Matt Art Board',
      gsm: 300,
      size: '700×1000mm',
      price: 31500,
      quantity: 35, // Low stock -> "Only 35 available"
      merchant_name: 'Premium Paper Co',
      merchant_id: 'merchant-alt-1',
      merchant_rating: 4.8,
      delivery: 'Yes',
      description: 'Elite quality matt board for professional printing.',
      created_at: new Date().toISOString()
    },
    {
      id: 'stock-3',
      name: 'NCR Carbonless Paper (CB)',
      gsm: 80,
      size: '610×860mm',
      price: 14200,
      quantity: 200,
      merchant_name: 'Express Forms Paper',
      merchant_id: 'merchant-demo',
      merchant_rating: 4.2,
      delivery: 'No',
      description: 'High-quality carbonless paper, CB white, excellent for multi-part business forms and invoices.',
      created_at: new Date().toISOString()
    },
    {
      id: 'stock-4',
      name: 'Woodfree Bond Paper',
      gsm: 80,
      size: '700×1000mm',
      price: 12500,
      quantity: 500,
      merchant_name: 'Premium Paper Co',
      merchant_id: 'merchant-demo',
      merchant_rating: 4.8,
      delivery: 'Yes',
      description: 'Uncoated woodfree printing and writing paper, ideal for books, letterheads, and notebooks.',
      created_at: new Date().toISOString()
    }
  ];

  // Seed default orders with payment proof to activate the payment verification panel
  const defaultOrders = [
    {
      id: 'order-1',
      order_number: 'ORD-58291',
      buyer_id: 'user-demo-id',
      buyer_name: 'John Ogueh',
      merchant_id: 'merchant-demo',
      merchant_name: 'Premium Paper Co',
      stock_id: 'stock-1',
      product_name: 'Gloss Art Paper',
      quantity: 120,
      unit_price: 18500,
      total_amount: 2222978,
      delivery_fee: 2978,
      delivery_address: 'Shomolu, Lagos',
      order_status: 'pending',
      payment_status: 'pending',
      payment_proof: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600', // Mock receipt visual
      transfer_note: 'Bank transfer receipt uploaded',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'order-2',
      order_number: 'ORD-49201',
      buyer_id: 'user-demo-id',
      buyer_name: 'John Ogueh',
      merchant_id: 'merchant-demo',
      merchant_name: 'Premium Paper Co',
      stock_id: 'stock-2',
      product_name: 'Matt Art Board',
      quantity: 50,
      unit_price: 32000,
      total_amount: 1602978,
      delivery_fee: 2978,
      delivery_address: 'Ikeja, Lagos',
      order_status: 'confirmed',
      payment_status: 'paid',
      payment_proof: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600',
      transfer_note: 'Verified online transfer ledger',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
    }
  ];

  if (!localStorage.getItem('demo_stocks')) {
    setStorageItem('demo_stocks', defaultStocks);
  }

  if (!localStorage.getItem('demo_orders')) {
    setStorageItem('demo_orders', defaultOrders);
  }

  // Define the proxy-based mock client
  const createMockQueryBuilder = (tableName: string) => {
    const currentData = getStorageItem(`demo_${tableName}`, tableName === 'stocks' ? defaultStocks : (tableName === 'orders' ? defaultOrders : []));
    let filteredData = [...currentData];

    const builder: any = {
      select: (columns: string = '*') => {
        return builder;
      },
      eq: (field: string, val: any) => {
        // Simple filter simulation
        if (field === 'merchant_id') {
          filteredData = filteredData.filter((item: any) => item.merchant_id === val || val === 'merchant-demo' || item.merchant_id === 'merchant-demo');
        } else if (field === 'id') {
          filteredData = filteredData.filter((item: any) => item.id === val);
        } else if (field === 'role') {
          filteredData = filteredData.filter((item: any) => item.role === val);
        }
        return builder;
      },
      gte: (field: string, val: any) => {
        return builder;
      },
      group_by: (field: string) => {
        return builder;
      },
      order: (field: string, opts?: any) => {
        return builder;
      },
      single: () => {
        const promise = Promise.resolve({ data: filteredData[0] || null, error: null });
        return Object.assign(promise, {
          then: (onfulfilled: any) => promise.then(onfulfilled)
        });
      },
      insert: (rows: any[]) => {
        const dataToInsert = Array.isArray(rows) ? rows : [rows];
        const newRows = dataToInsert.map(row => ({
          id: row.id || `row-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          ...row
        }));
        const updated = [...currentData, ...newRows];
        setStorageItem(`demo_${tableName}`, updated);
        filteredData = newRows;
        
        const promise = Promise.resolve({ data: newRows, error: null });
        return Object.assign(promise, {
          then: (onfulfilled: any) => promise.then(onfulfilled),
          select: () => {
            return builder;
          }
        });
      },
      upsert: (rows: any) => {
        const dataToUpsert = Array.isArray(rows) ? rows : [rows];
        const upsertedRows = dataToUpsert.map(row => {
          const existing = currentData.find((item: any) => item.id && row.id && item.id === row.id);
          return existing
            ? { ...existing, ...row }
            : { id: row.id || `row-${Math.random().toString(36).substr(2, 9)}`, created_at: new Date().toISOString(), ...row };
        });
        const updated = currentData.filter((item: any) => !upsertedRows.some((row: any) => row.id === item.id));
        setStorageItem(`demo_${tableName}`, [...updated, ...upsertedRows]);
        filteredData = upsertedRows;
        return builder;
      },
      update: (fields: any) => {
        // Simulate update
        filteredData.forEach((item: any) => {
          Object.assign(item, fields);
        });
        const updated = currentData.map((item: any) => {
          const matched = filteredData.find((f: any) => f.id === item.id);
          return matched || item;
        });
        setStorageItem(`demo_${tableName}`, updated);

        const promise = Promise.resolve({ data: filteredData, error: null });
        return Object.assign(promise, {
          then: (onfulfilled: any) => promise.then(onfulfilled),
          select: () => builder,
          eq: (field: string, val: any) => {
            builder.eq(field, val);
            return builder;
          }
        });
      },
      delete: () => {
        const remaining = currentData.filter((item: any) => !filteredData.some((f: any) => f.id === item.id));
        setStorageItem(`demo_${tableName}`, remaining);
        
        const promise = Promise.resolve({ data: filteredData, error: null });
        return Object.assign(promise, {
          then: (onfulfilled: any) => promise.then(onfulfilled),
          eq: (field: string, val: any) => {
            builder.eq(field, val);
            return builder;
          }
        });
      },
      then: (resolve: any) => {
        return resolve({ data: filteredData, error: null });
      }
    };

    return builder;
  };

  const authListeners = new Set<any>();

  const mockAuth = {
    getUser: async () => {
      const activeSession = getStorageItem('demo_session', null);
      return { data: { user: activeSession ? activeSession.user : null }, error: null };
    },
    getSession: async () => {
      const activeSession = getStorageItem('demo_session', null);
      return { data: { session: activeSession }, error: null };
    },
    signInWithPassword: async (credentials: any) => {
      const isMerchant = credentials.email.includes('merchant');
      const mockUser = {
        id: isMerchant ? 'merchant-demo' : 'user-demo-id',
        email: credentials.email,
        user_metadata: { full_name: 'Demo User' }
      };
      const session = {
        access_token: 'demo-token',
        user: mockUser
      };
      setStorageItem('demo_session', session);
      
      const users = getStorageItem('demo_users', []);
      const existingUser = users.find((u: any) => u.email === credentials.email);
      if (!existingUser) {
        users.push({
          id: mockUser.id,
          email: credentials.email,
          full_name: 'Demo User',
          role: isMerchant ? 'merchant' : 'buyer'
        });
        setStorageItem('demo_users', users);
      }
      
      setTimeout(() => {
        if (authListeners.size > 0) {
          authListeners.forEach(listener => listener('SIGNED_IN', session));
        }
      }, 100);

      return { data: { session, user: mockUser }, error: null };
    },
    signUp: async (credentials: any) => {
      const isMerchant = credentials.options?.data?.role === 'merchant';
      const mockUser = {
        id: isMerchant ? 'merchant-demo' : 'user-demo-id',
        email: credentials.email,
        email_confirmed_at: new Date().toISOString(),
        user_metadata: credentials.options?.data || {}
      };
      const session = {
        access_token: 'demo-token',
        user: mockUser
      };
      setStorageItem('demo_session', session);
      
      const users = getStorageItem('demo_users', []);
      users.push({
        id: mockUser.id,
        email: credentials.email,
        full_name: credentials.options?.data?.full_name || 'Demo User',
        role: credentials.options?.data?.role || 'buyer',
        phone: credentials.options?.data?.phone || '',
        state: credentials.options?.data?.state || '',
        city: credentials.options?.data?.city || ''
      });
      setStorageItem('demo_users', users);

      setTimeout(() => {
        if (authListeners.size > 0) {
          authListeners.forEach(listener => listener('SIGNED_IN', session));
        }
      }, 100);

      return { data: { session, user: mockUser }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('demo_session');
      setTimeout(() => {
        if (authListeners.size > 0) {
          authListeners.forEach(listener => listener('SIGNED_OUT', null));
        }
      }, 100);
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      authListeners.add(callback);
      const activeSession = getStorageItem('demo_session', null);
      setTimeout(() => {
        callback('INITIAL_SESSION', activeSession);
      }, 50);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            }
          }
        }
      };
    }
  };

  const mockStorage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=400` } };
      },
      remove: async (paths: string[]) => {
        return { data: paths, error: null };
      }
    })
  };

  const mockFunctions = {
    invoke: async (functionName: string, options: any) => {
      console.log(`Mocking Supabase function invoke: ${functionName}`, options);
      return { data: { success: true }, error: null };
    }
  };

  supabaseClientInstance = {
    auth: mockAuth,
    from: (tableName: string) => createMockQueryBuilder(tableName),
    storage: mockStorage,
    functions: mockFunctions,
    channel: (name: string) => {
      const channelObj: any = {
        on: (type: string, filter: any, callback: any) => {
          return channelObj;
        },
        subscribe: () => {
          return {
            unsubscribe: () => {}
          };
        }
      };
      return channelObj;
    }
  };
}

export const supabase = supabaseClientInstance;
