/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useStore, Product, CommunityItem, NewsItem, AboutContent } from './store';
import { ShoppingBag, Search, X, Plus, Minus, Trash2, LogIn, LogOut, Settings, Package, CreditCard, Upload } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="min-h-screen w-full bg-[#f9f9f7] flex flex-col relative"
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-8 border border-[#1a1c1b] px-4 py-1.5 text-[9px] font-body tracking-[0.3em] uppercase text-[#1a1c1b]">
          ennimal inside.
        </div>
        <h1 className="font-headline text-6xl md:text-8xl tracking-[0.1em] text-[#1a1c1b] font-light">
          N.NIMAL
        </h1>
        <p className="mt-6 text-[10px] md:text-[11px] font-body tracking-[0.3em] text-[#777777] uppercase">
          welcome to ennimal state.
        </p>
      </div>
      
      <div className="absolute bottom-16 left-0 right-0 flex justify-center">
        <button 
          onClick={() => navigate('/home')}
          className="text-[10px] font-body tracking-[0.4em] text-[#1a1c1b] hover:opacity-40 transition-opacity duration-700 uppercase"
        >
          Explore Here
        </button>
      </div>
    </motion.div>
  );
}

function Navbar({ user }: { user: User | null }) {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setCartOpen, setAdminModalOpen, cart, isAdminAuthenticated } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 1000);

    if (clickCount + 1 === 3) {
      setClickCount(0);
      if (isAdminAuthenticated) {
        navigate('/admin');
      } else {
        setAdminModalOpen(true);
      }
    } else {
      navigate('/');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/home');
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="w-full px-8 md:px-16 py-10 flex justify-between items-center bg-transparent absolute top-0 z-50">
      <div 
        onClick={handleLogoClick}
        className="font-headline text-sm tracking-[0.15em] text-[#1a1c1b] cursor-pointer select-none"
      >
        N.NIMAL
      </div>
      <div className="hidden md:flex space-x-16 text-[9px] font-body tracking-[0.25em] uppercase text-[#777777]">
        <button onClick={() => navigate('/catalog')} className="hover:text-[#1a1c1b] transition-colors duration-500">Catalog</button>
        <button onClick={() => { navigate('/home'); setTimeout(() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-[#1a1c1b] transition-colors duration-500">Community</button>
        <button onClick={() => navigate('/news')} className="hover:text-[#1a1c1b] transition-colors duration-500">News</button>
        <button onClick={() => navigate('/about')} className="hover:text-[#1a1c1b] transition-colors duration-500">About</button>
      </div>
      <div className="flex space-x-6 text-[#1a1c1b] items-center">
        {user ? (
          <button onClick={handleLogout} className="text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-40 transition-opacity duration-500">
            <LogOut size={14} />
            <span className="hidden md:inline">Logout</span>
          </button>
        ) : (
          <button onClick={handleLogin} className="text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-40 transition-opacity duration-500">
            <LogIn size={14} />
            <span className="hidden md:inline">Login</span>
          </button>
        )}
        
        {isAdminAuthenticated && location.pathname !== '/admin' && (
          <button onClick={() => navigate('/admin')} className="hover:opacity-40 transition-opacity duration-500">
            <Settings size={16} />
          </button>
        )}

        <button onClick={() => setCartOpen(true)} className="relative hover:opacity-40 transition-opacity duration-500">
          <ShoppingBag size={16} />
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#1a1c1b] text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

function AdminModal() {
  const { isAdminModalOpen, setAdminModalOpen, setAdminAuthenticated } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      if (password === 'admin123') {
        setAdminAuthenticated(true);
        setAdminModalOpen(false);
        navigate('/admin');
      } else {
        setError('Incorrect password');
      }
      setLoading(false);
    }, 500);
  };

  if (!isAdminModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-xl tracking-widest uppercase">Admin Access</h2>
          <button onClick={() => setAdminModalOpen(false)}><X size={20} /></button>
        </div>
        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent"
              placeholder="Enter admin password"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1a1c1b] text-white py-4 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
          >
            {loading ? 'Verifying...' : 'Enter Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Cart() {
  const { isCartOpen, setCartOpen, cart, removeFromCart, updateQuantity, clearCart } = useStore();
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart');
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'payment');
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setPaymentSettings(docSnap.data());
        }
      });
    };
    fetchSettings();
  }, []);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.4 }}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col relative z-10"
      >
        <div className="p-8 flex justify-between items-center border-b border-gray-100">
          <h2 className="font-headline text-xl tracking-widest uppercase">
            {checkoutStep === 'cart' ? 'Cart' : 'Checkout'}
          </h2>
          <button onClick={() => { setCartOpen(false); setCheckoutStep('cart'); }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {checkoutStep === 'cart' ? (
            cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#1a1c1b] space-y-6 text-center px-4">
                <h3 className="text-xl font-bold tracking-tight">Your cart is empty</h3>
                <p className="text-sm text-[#777777]">
                  {user ? 'Discover products to add to your cart.' : 'Discover products or log in to pick up where you left off.'}
                </p>
                <div className="flex gap-4 mt-4">
                  <button onClick={() => { setCartOpen(false); navigate('/catalog'); }} className="px-6 py-3 border border-[#1a1c1b] text-[12px] font-bold rounded-full hover:bg-gray-50 transition-colors">
                    Continue Shopping
                  </button>
                  {!user && (
                    <button onClick={() => { setCartOpen(false); navigate('/login'); }} className="px-6 py-3 bg-[#1a1c1b] text-white text-[12px] font-bold rounded-full hover:bg-black/80 transition-colors">
                      Login
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-6">
                    <div className="w-24 aspect-[3/4] bg-gray-100">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover grayscale-[0.2]" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div>
                        <h3 className="text-[11px] uppercase tracking-widest font-medium">{item.name}</h3>
                        <p className="text-[#777777] text-[10px] mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-gray-50"><Minus size={12} /></button>
                          <span className="px-4 text-[10px]">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-gray-50"><Plus size={12} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-[#777777] hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-8">
              <div className="bg-gray-50 p-6 space-y-4">
                <h3 className="text-[10px] uppercase tracking-widest font-medium mb-4">Order Summary</h3>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-[10px] text-[#777777]">
                    <span>{item.quantity}x {item.name}</span>
                    <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200 flex justify-between font-medium text-[#1a1c1b]">
                  <span className="text-[10px] uppercase tracking-widest">Total</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] uppercase tracking-widest font-medium">Payment Methods</h3>
                
                {paymentSettings?.bcaAccount && (
                  <div className="border border-gray-200 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#777777] mb-2">BCA Transfer</p>
                    <p className="font-mono text-sm">{paymentSettings.bcaAccount}</p>
                  </div>
                )}

                {paymentSettings?.mandiriAccount && (
                  <div className="border border-gray-200 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#777777] mb-2">Mandiri Transfer</p>
                    <p className="font-mono text-sm">{paymentSettings.mandiriAccount}</p>
                  </div>
                )}

                {paymentSettings?.qrisImageUrl && (
                  <div className="border border-gray-200 p-4 flex flex-col items-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#777777] mb-4 w-full text-left">QRIS</p>
                    <img src={paymentSettings.qrisImageUrl} alt="QRIS" className="w-48 h-48 object-contain" />
                  </div>
                )}

                {!paymentSettings?.bcaAccount && !paymentSettings?.mandiriAccount && !paymentSettings?.qrisImageUrl && (
                  <p className="text-[10px] text-[#777777]">No payment methods configured.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-8 border-t border-gray-100 bg-white">
            {checkoutStep === 'cart' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-[#777777]">Subtotal</span>
                  <span className="font-medium">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                <button 
                  onClick={() => setCheckoutStep('payment')}
                  className="w-full bg-[#1a1c1b] text-white py-4 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  alert('Order placed successfully! Please complete your payment.');
                  clearCart();
                  setCartOpen(false);
                  setCheckoutStep('cart');
                }}
                className="w-full bg-[#1a1c1b] text-white py-4 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
              >
                Confirm Order
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Hero() {
  return (
    <section className="min-h-screen w-full pt-40 pb-32 px-8 md:px-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 h-[75vh]">
        <div className="h-full overflow-hidden bg-[#f4f4f2]">
          <img 
            src="https://images.unsplash.com/photo-1611042553365-9b101441c135?q=80&w=1000&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale-[0.3] hover:scale-[1.03] transition-transform duration-[3s] ease-out" 
            alt="Mirror Selfie" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="h-full overflow-hidden bg-[#f4f4f2] mt-0 md:mt-24">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale-[0.3] hover:scale-[1.03] transition-transform duration-[3s] ease-out" 
            alt="Casual Outdoor" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="h-full overflow-hidden bg-[#f4f4f2] mt-0 md:mt-12">
          <img 
            src="https://images.unsplash.com/photo-1529139574466-a303027c028b?q=80&w=1000&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale-[0.3] hover:scale-[1.03] transition-transform duration-[3s] ease-out" 
            alt="Everyday Life" 
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </section>
  );
}

function IntroText() {
  return (
    <section className="w-full py-32 px-8 md:px-16 flex flex-col items-center justify-center text-center bg-[#f9f9f7]">
      <h2 className="font-headline text-2xl tracking-[0.2em] mb-16">N.NIMAL</h2>
      <div className="font-body text-[10px] md:text-[11px] tracking-[0.2em] leading-[2.5] text-[#444444] uppercase max-w-2xl mx-auto space-y-8">
        <p>
          N.NIMAL is a study in silence.<br/>
          A reflection of the in-between—<br/>
          not fully instinct, not fully aware.
        </p>
        <p>
          Built for those who keep moving,<br/>
          even without reason.
        </p>
        <p>
          Not to stand out,<br/>
          but to exist.
        </p>
        <p>
          We are not here to be seen.<br/>
          We are here to exist in between.
        </p>
      </div>
    </section>
  );
}

function Community() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CommunityItem[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'community'), (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityItem));
      fetchedItems.sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(fetchedItems);
    });
    return () => unsubscribe();
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="community" className="w-full py-40 px-8 md:px-16 bg-[#f9f9f7]">
      <div className="flex justify-between items-end mb-20">
        <h2 className="text-[9px] font-body tracking-[0.3em] uppercase text-[#777777]">Community</h2>
        <button onClick={() => { navigate('/home'); setTimeout(() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-[9px] font-body tracking-[0.3em] uppercase border-b border-[#777777] text-[#777777] hover:text-[#1a1c1b] hover:border-[#1a1c1b] transition-colors duration-500 pb-1">View All</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        {items.map((item, index) => {
          const isEven = index % 2 === 0;
          return (
            <React.Fragment key={item.id}>
              {isEven ? (
                <>
                  <div className="aspect-[4/5] overflow-hidden bg-[#f4f4f2]">
                    <img 
                      src={item.imageUrl} 
                      className="w-full h-full object-cover grayscale-[0.2] hover:opacity-70 transition-opacity duration-700" 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col space-y-8">
                    <h3 className="font-headline text-2xl tracking-[0.1em] uppercase">{item.title}</h3>
                    <p className="text-[11px] font-body tracking-[0.15em] leading-[2] text-[#777777] uppercase">
                      {item.excerpt}
                    </p>
                    <button onClick={() => { navigate('/home'); setTimeout(() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-[9px] font-body tracking-[0.3em] uppercase border-b border-[#1a1c1b] text-[#1a1c1b] self-start pb-1 hover:opacity-50 transition-opacity">Read Article</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col space-y-8 order-2 md:order-1">
                    <h3 className="font-headline text-2xl tracking-[0.1em] uppercase">{item.title}</h3>
                    <p className="text-[11px] font-body tracking-[0.15em] leading-[2] text-[#777777] uppercase">
                      {item.excerpt}
                    </p>
                    <button onClick={() => { navigate('/home'); setTimeout(() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-[9px] font-body tracking-[0.3em] uppercase border-b border-[#1a1c1b] text-[#1a1c1b] self-start pb-1 hover:opacity-50 transition-opacity">Read Article</button>
                  </div>
                  <div className="aspect-[4/5] overflow-hidden bg-[#f4f4f2] order-1 md:order-2">
                    <img 
                      src={item.imageUrl} 
                      className="w-full h-full object-cover grayscale-[0.2] hover:opacity-70 transition-opacity duration-700" 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

function NewsPage({ user }: { user: User | null }) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
      fetchedItems.sort((a, b) => (a.order || 0) - (b.order || 0));
      setNewsItems(fetchedItems);
    });
    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="w-full min-h-screen bg-[#f9f9f7] text-[#1a1c1b] flex flex-col"
    >
      <Navbar user={user} />
      <div className="flex-1 pt-40 px-8 md:px-16 max-w-4xl mx-auto w-full">
        <div className="text-center mb-20">
          <h1 className="font-headline text-3xl tracking-[0.1em] uppercase mb-4">Blog Toko</h1>
          <p className="text-[12px] font-body tracking-[0.1em] text-[#777777]">Temukan event, kabar terbaru, dan promosi terbaru di sini!</p>
        </div>

        {newsItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <Package size={48} className="mb-6" strokeWidth={1} />
            <h3 className="font-headline text-xl tracking-[0.1em] uppercase mb-2">Belum ada postingan blog</h3>
            <p className="text-[10px] font-body tracking-[0.15em] text-[#777777] uppercase">Nantikan update dan cerita terbaru kami.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-12">
            {newsItems.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-baseline border-b border-gray-200 pb-12 group cursor-pointer">
                <div className="text-[9px] font-body tracking-[0.3em] text-[#777777] md:w-48 mb-4 md:mb-0 shrink-0">
                  {item.date}
                </div>
                <div className="flex flex-col space-y-4">
                  <h3 className="font-headline text-lg tracking-[0.1em] uppercase group-hover:text-gray-500 transition-colors">{item.title}</h3>
                  <p className="text-[10px] font-body tracking-[0.15em] leading-[2] text-[#777777] uppercase">{item.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      <Cart />
      <AdminModal />
    </motion.div>
  );
}

function AboutPage({ user }: { user: User | null }) {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'about', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setAboutContent({ id: docSnap.id, ...docSnap.data() } as AboutContent);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="w-full min-h-screen bg-[#f9f9f7] text-[#1a1c1b] flex flex-col"
    >
      <Navbar user={user} />
      <div className="flex-1 pt-32 pb-40 px-8 md:px-16 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        {aboutContent?.imageUrl && (
          <div className="w-full aspect-video md:aspect-[21/9] mb-20 overflow-hidden">
            <img src={aboutContent.imageUrl} alt="About N.NIMAL" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="max-w-3xl">
          <div className="font-headline text-xl md:text-2xl tracking-[0.1em] leading-[1.8] text-[#1a1c1b] space-y-8">
            {aboutContent?.paragraphs?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {(!aboutContent?.paragraphs || aboutContent.paragraphs.length === 0) && (
              <p className="opacity-50 italic">About content has not been set up yet.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <Cart />
      <AdminModal />
    </motion.div>
  );
}

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section id="catalog" className="w-full pt-48 pb-32 px-8 md:px-16 bg-white min-h-screen">
      <div className="flex justify-between items-end mb-20">
        <h2 className="text-[9px] font-body tracking-[0.3em] uppercase text-[#777777]">Catalog</h2>
        <button onClick={() => navigate('/home')} className="text-[9px] font-body tracking-[0.3em] uppercase text-[#777777] hover:text-[#1a1c1b] transition-colors flex items-center gap-2">
          &larr; Back to Home
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-16">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-12">
          <div>
            <h3 className="text-[10px] font-body tracking-[0.2em] uppercase text-[#1a1c1b] mb-6">Product Type</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">T-Shirts</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">Hoodies</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">Accessories</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-body tracking-[0.2em] uppercase text-[#1a1c1b] mb-6">Availability</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">In Stock</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">Out of Stock</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-body tracking-[0.2em] uppercase text-[#1a1c1b] mb-6">Price</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">Rp 0 - Rp 650.000</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">Rp 650.000 - Rp 1.500.000</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="appearance-none w-3 h-3 border border-[#1a1c1b] checked:bg-[#1a1c1b] transition-colors" />
                <span className="text-[9px] font-body tracking-[0.15em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors">Rp 1.500.000+</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-20 text-[#777777] text-[10px] uppercase tracking-widest">
              No products available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col space-y-6 group">
                  <div className="aspect-[3/4] overflow-hidden bg-[#f4f4f2] relative cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                    <img 
                      src={product.imageUrl} 
                      className="w-full h-full object-cover grayscale-[0.1] group-hover:scale-[1.02] transition-transform duration-[2s] ease-out" 
                      alt={product.name} 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product); setCartOpen(true); }}
                        className="bg-white text-[#1a1c1b] px-6 py-3 text-[9px] uppercase tracking-widest hover:bg-[#1a1c1b] hover:text-white transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-body tracking-[0.25em] uppercase text-[#777777] group-hover:text-[#1a1c1b] transition-colors duration-500">
                      <span className="font-medium cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</span>
                      <span>Rp {product.price.toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-[9px] text-[#a0a0a0] line-clamp-2">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-[#424436] text-white pt-24 pb-8 px-8 md:px-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
        <div className="col-span-1">
          <h2 className="font-headline text-3xl tracking-[0.1em] mb-8 uppercase font-bold">N.NIMAL</h2>
          <div className="space-y-6 text-[11px] font-body tracking-[0.1em] leading-[2] text-[#e0e0e0]">
            <p>
              N.NIMAL is a study in silence.<br />
              A reflection of the in-between—<br />
              not fully instinct, not fully aware.
            </p>
            <p>
              Built for those who keep moving,<br />
              even without reason.
            </p>
            <p>
              Not to stand out,<br />
              but to exist.
            </p>
            <p>
              We are not here to be seen.<br />
              We are here to exist in between.
            </p>
          </div>
        </div>
        
        <div className="col-span-1 flex flex-col space-y-12">
          <div>
            <h3 className="text-[12px] font-body tracking-[0.1em] mb-6">Metode Pembayaran</h3>
            <div className="flex flex-wrap gap-6 items-center">
              <span className="text-[14px] font-bold tracking-widest text-white">QRIS</span>
              <span className="text-[14px] font-bold tracking-widest text-white">mandiri</span>
              <span className="text-[14px] font-bold tracking-widest text-white italic">BCA</span>
            </div>
          </div>

          <div>
            <h3 className="text-[12px] font-body tracking-[0.1em] mb-6">Metode Pengiriman</h3>
            <div className="flex flex-wrap gap-6 items-center">
              <span className="text-[14px] font-bold tracking-widest text-white italic">JNE</span>
              <span className="text-[14px] font-bold tracking-widest text-white italic">J&T</span>
              <span className="text-[14px] font-bold tracking-widest text-white italic">SiCepat</span>
              <span className="text-[14px] font-bold tracking-widest text-white italic">GoSend</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[8px] font-body tracking-[0.3em] uppercase text-[#a0a0a0]">© 2026 N.NIMAL. All rights reserved.</p>
        <div className="flex space-x-8 text-[8px] font-body tracking-[0.3em] uppercase text-[#a0a0a0]">
          <button onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacy Policy</button>
          <button onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Terms of Service</button>
        </div>
      </div>
    </footer>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdminAuthenticated } = useStore();
  const [activeTab, setActiveTab] = useState<'products' | 'community' | 'news' | 'about' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [communityItems, setCommunityItems] = useState<CommunityItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [aboutContent, setAboutContent] = useState<AboutContent>({ id: 'main', paragraphs: [] });
  const [paymentSettings, setPaymentSettings] = useState({ bcaAccount: '', mandiriAccount: '', qrisImageUrl: '' });
  
  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({ name: '', description: '', price: '', imageUrl: '' });

  const [editingCommunity, setEditingCommunity] = useState<CommunityItem | null>(null);
  const [communityFormData, setCommunityFormData] = useState({ title: '', excerpt: '', imageUrl: '', order: '0' });

  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsFormData, setNewsFormData] = useState({ date: '', title: '', excerpt: '', order: '0' });

  const [aboutFormData, setAboutFormData] = useState({ paragraphs: '', imageUrl: '' });

  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/home');
      return;
    }

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubCommunity = onSnapshot(collection(db, 'community'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityItem));
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCommunityItems(items);
    });

    const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      setNewsItems(items);
    });

    const unsubAbout = onSnapshot(doc(db, 'about', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AboutContent;
        setAboutContent({ id: docSnap.id, ...data });
        setAboutFormData({ 
          paragraphs: data.paragraphs ? data.paragraphs.join('\n\n') : '',
          imageUrl: data.imageUrl || ''
        });
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'payment'), (docSnap) => {
      if (docSnap.exists()) {
        setPaymentSettings(docSnap.data() as any);
      }
    });

    return () => {
      unsubProducts();
      unsubCommunity();
      unsubNews();
      unsubAbout();
      unsubSettings();
    };
  }, [isAdminAuthenticated, navigate]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: productFormData.name,
      description: productFormData.description,
      price: Number(productFormData.price),
      imageUrl: productFormData.imageUrl,
      createdAt: new Date().toISOString()
    };

    if (editingProduct) {
      await updateDoc(doc(db, 'products', editingProduct.id), productData);
    } else {
      await addDoc(collection(db, 'products'), productData);
    }

    setProductFormData({ name: '', description: '', price: '', imageUrl: '' });
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const handleSaveCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title: communityFormData.title,
      excerpt: communityFormData.excerpt,
      imageUrl: communityFormData.imageUrl,
      order: Number(communityFormData.order)
    };

    if (editingCommunity) {
      await updateDoc(doc(db, 'community', editingCommunity.id), data);
    } else {
      await addDoc(collection(db, 'community'), data);
    }

    setCommunityFormData({ title: '', excerpt: '', imageUrl: '', order: '0' });
    setEditingCommunity(null);
  };

  const handleDeleteCommunity = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this community item?')) {
      await deleteDoc(doc(db, 'community', id));
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date: newsFormData.date,
      title: newsFormData.title,
      excerpt: newsFormData.excerpt,
      order: Number(newsFormData.order)
    };

    if (editingNews) {
      await updateDoc(doc(db, 'news', editingNews.id), data);
    } else {
      await addDoc(collection(db, 'news'), data);
    }

    setNewsFormData({ date: '', title: '', excerpt: '', order: '0' });
    setEditingNews(null);
  };

  const handleDeleteNews = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      await deleteDoc(doc(db, 'news', id));
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    const paragraphs = aboutFormData.paragraphs.split('\n\n').filter(p => p.trim() !== '');
    await setDoc(doc(db, 'about', 'main'), { paragraphs, imageUrl: aboutFormData.imageUrl });
    alert('About content saved successfully');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await setDoc(doc(db, 'settings', 'payment'), paymentSettings);
    alert('Settings saved successfully');
  };

  if (!isAdminAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b] flex flex-col">
      <div className="flex-1 p-8 md:p-16 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-16">
          <h1 className="font-headline text-3xl tracking-[0.15em]">Admin Dashboard</h1>
          <button onClick={() => navigate('/home')} className="text-[10px] uppercase tracking-widest hover:opacity-50">
            Back to Site
          </button>
        </div>

        <div className="flex space-x-8 mb-12 border-b border-gray-200 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('products')}
            className={`pb-4 text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'products' ? 'border-b-2 border-[#1a1c1b] font-medium' : 'text-[#777777]'}`}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`pb-4 text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'community' ? 'border-b-2 border-[#1a1c1b] font-medium' : 'text-[#777777]'}`}
          >
            Community
          </button>
          <button 
            onClick={() => setActiveTab('news')}
            className={`pb-4 text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'news' ? 'border-b-2 border-[#1a1c1b] font-medium' : 'text-[#777777]'}`}
          >
            News
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`pb-4 text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'about' ? 'border-b-2 border-[#1a1c1b] font-medium' : 'text-[#777777]'}`}
          >
            About
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-b-2 border-[#1a1c1b] font-medium' : 'text-[#777777]'}`}
          >
            Payment Settings
          </button>
        </div>

        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1">
              <h2 className="text-[12px] uppercase tracking-widest font-medium mb-8">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Name</label>
                  <input required type="text" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Description</label>
                  <textarea required value={productFormData.description} onChange={e => setProductFormData({...productFormData, description: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent resize-none h-24" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Price (Rp)</label>
                  <input required type="number" value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Image URL</label>
                  <input required type="url" value={productFormData.imageUrl} onChange={e => setProductFormData({...productFormData, imageUrl: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-[#1a1c1b] text-white py-3 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors">
                    {editingProduct ? 'Update' : 'Add'} Product
                  </button>
                  {editingProduct && (
                    <button type="button" onClick={() => { setEditingProduct(null); setProductFormData({ name: '', description: '', price: '', imageUrl: '' }); }} className="px-6 border border-[#1a1c1b] text-[10px] uppercase tracking-widest hover:bg-gray-50">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {products.map(product => (
                  <div key={product.id} className="bg-white p-6 shadow-sm flex gap-6">
                    <img src={product.imageUrl} alt={product.name} className="w-24 h-32 object-cover grayscale-[0.2]" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[11px] uppercase tracking-widest font-medium">{product.name}</h3>
                        <p className="text-[#777777] text-[10px] mt-1">Rp {product.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setProductFormData({ name: product.name, description: product.description, price: product.price.toString(), imageUrl: product.imageUrl });
                          }} 
                          className="text-[10px] uppercase tracking-widest text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-[10px] uppercase tracking-widest text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'community' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1">
              <h2 className="text-[12px] uppercase tracking-widest font-medium mb-8">
                {editingCommunity ? 'Edit Community Item' : 'Add Community Item'}
              </h2>
              <form onSubmit={handleSaveCommunity} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Title</label>
                  <input required type="text" value={communityFormData.title} onChange={e => setCommunityFormData({...communityFormData, title: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Excerpt</label>
                  <textarea required value={communityFormData.excerpt} onChange={e => setCommunityFormData({...communityFormData, excerpt: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent resize-none h-24" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Image URL</label>
                  <input required type="url" value={communityFormData.imageUrl} onChange={e => setCommunityFormData({...communityFormData, imageUrl: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Order</label>
                  <input required type="number" value={communityFormData.order} onChange={e => setCommunityFormData({...communityFormData, order: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-[#1a1c1b] text-white py-3 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors">
                    {editingCommunity ? 'Update' : 'Add'} Item
                  </button>
                  {editingCommunity && (
                    <button type="button" onClick={() => { setEditingCommunity(null); setCommunityFormData({ title: '', excerpt: '', imageUrl: '', order: '0' }); }} className="px-6 border border-[#1a1c1b] text-[10px] uppercase tracking-widest hover:bg-gray-50">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {communityItems.map(item => (
                  <div key={item.id} className="bg-white p-6 shadow-sm flex gap-6">
                    <img src={item.imageUrl} alt={item.title} className="w-24 h-32 object-cover grayscale-[0.2]" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[11px] uppercase tracking-widest font-medium">{item.title}</h3>
                        <p className="text-[#777777] text-[10px] mt-1 line-clamp-2">{item.excerpt}</p>
                        <p className="text-[#777777] text-[9px] mt-2">Order: {item.order}</p>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <button 
                          onClick={() => {
                            setEditingCommunity(item);
                            setCommunityFormData({ title: item.title, excerpt: item.excerpt, imageUrl: item.imageUrl, order: item.order.toString() });
                          }} 
                          className="text-[10px] uppercase tracking-widest text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteCommunity(item.id)} className="text-[10px] uppercase tracking-widest text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'news' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1">
              <h2 className="text-[12px] uppercase tracking-widest font-medium mb-8">
                {editingNews ? 'Edit News Item' : 'Add News Item'}
              </h2>
              <form onSubmit={handleSaveNews} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Date</label>
                  <input required type="text" value={newsFormData.date} onChange={e => setNewsFormData({...newsFormData, date: e.target.value})} placeholder="e.g. MAR 24, 2026" className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Title</label>
                  <input required type="text" value={newsFormData.title} onChange={e => setNewsFormData({...newsFormData, title: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Excerpt</label>
                  <textarea required value={newsFormData.excerpt} onChange={e => setNewsFormData({...newsFormData, excerpt: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent resize-none h-24" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Order</label>
                  <input required type="number" value={newsFormData.order} onChange={e => setNewsFormData({...newsFormData, order: e.target.value})} className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-[#1a1c1b] text-white py-3 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors">
                    {editingNews ? 'Update' : 'Add'} News
                  </button>
                  {editingNews && (
                    <button type="button" onClick={() => { setEditingNews(null); setNewsFormData({ date: '', title: '', excerpt: '', order: '0' }); }} className="px-6 border border-[#1a1c1b] text-[10px] uppercase tracking-widest hover:bg-gray-50">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2">
              <div className="flex flex-col space-y-4">
                {newsItems.map(item => (
                  <div key={item.id} className="bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-[9px] font-body tracking-[0.3em] text-[#777777] mb-2">{item.date}</div>
                      <h3 className="text-[11px] uppercase tracking-widest font-medium mb-2">{item.title}</h3>
                      <p className="text-[#777777] text-[10px] line-clamp-2">{item.excerpt}</p>
                      <p className="text-[#777777] text-[9px] mt-2">Order: {item.order}</p>
                    </div>
                    <div className="flex gap-4 items-start shrink-0">
                      <button 
                        onClick={() => {
                          setEditingNews(item);
                          setNewsFormData({ date: item.date, title: item.title, excerpt: item.excerpt, order: item.order.toString() });
                        }} 
                        className="text-[10px] uppercase tracking-widest text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDeleteNews(item.id)} className="text-[10px] uppercase tracking-widest text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'about' ? (
          <div className="max-w-3xl">
            <h2 className="text-[12px] uppercase tracking-widest font-medium mb-8">About Content</h2>
            <form onSubmit={handleSaveAbout} className="space-y-8">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Header Image URL</label>
                <input 
                  type="url" 
                  value={aboutFormData.imageUrl} 
                  onChange={e => setAboutFormData({ ...aboutFormData, imageUrl: e.target.value })} 
                  className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                {aboutFormData.imageUrl && (
                  <div className="mt-4 w-full aspect-video bg-gray-100">
                    <img src={aboutFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Paragraphs (Separate by double newlines)</label>
                <textarea 
                  value={aboutFormData.paragraphs} 
                  onChange={e => setAboutFormData({ ...aboutFormData, paragraphs: e.target.value })} 
                  className="w-full border border-[#1a1c1b] p-4 focus:outline-none bg-transparent resize-none h-64 font-body text-sm"
                  placeholder="First paragraph...&#10;&#10;Second paragraph..."
                />
              </div>
              <button type="submit" className="w-full bg-[#1a1c1b] text-white py-4 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors">
                Save About Content
              </button>
            </form>
          </div>
        ) : (
          <div className="max-w-md">
            <h2 className="text-[12px] uppercase tracking-widest font-medium mb-8">Payment Methods</h2>
            <form onSubmit={handleSaveSettings} className="space-y-8">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">BCA Account Details</label>
                <textarea 
                  value={paymentSettings.bcaAccount} 
                  onChange={e => setPaymentSettings({...paymentSettings, bcaAccount: e.target.value})} 
                  className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent resize-none h-24"
                  placeholder="e.g. BCA 1234567890 a.n N.NIMAL"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">Mandiri Account Details</label>
                <textarea 
                  value={paymentSettings.mandiriAccount} 
                  onChange={e => setPaymentSettings({...paymentSettings, mandiriAccount: e.target.value})} 
                  className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent resize-none h-24"
                  placeholder="e.g. Mandiri 0987654321 a.n N.NIMAL"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#777777] mb-2">QRIS Image URL</label>
                <input 
                  type="url" 
                  value={paymentSettings.qrisImageUrl} 
                  onChange={e => setPaymentSettings({...paymentSettings, qrisImageUrl: e.target.value})} 
                  className="w-full border-b border-[#1a1c1b] py-2 focus:outline-none bg-transparent" 
                  placeholder="https://example.com/qris.png"
                />
                {paymentSettings.qrisImageUrl && (
                  <div className="mt-4 p-4 bg-white inline-block">
                    <img src={paymentSettings.qrisImageUrl} alt="QRIS Preview" className="w-32 h-32 object-contain" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-[#1a1c1b] text-white py-4 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors">
                Save Settings
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function Catalog({ user }: { user: User | null }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="w-full min-h-screen bg-[#f9f9f7] text-[#1a1c1b] flex flex-col"
    >
      <Navbar user={user} />
      <div className="flex-1">
        <Products />
      </div>
      <Footer />
      <Cart />
      <AdminModal />
    </motion.div>
  );
}

function Home({ user }: { user: User | null }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="w-full min-h-screen bg-[#f9f9f7] text-[#1a1c1b]"
    >
      <Navbar user={user} />
      <Hero />
      <IntroText />
      <Community />
      <Footer />
      <Cart />
      <AdminModal />
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <HashRouter>
      <AppRoutes user={user} />
    </HashRouter>
  );
}

function Account({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState<'pesanan' | 'wishlist'>('pesanan');
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="w-full min-h-screen bg-[#f4f4f2] text-[#1a1c1b] flex flex-col"
    >
      <Navbar user={user} />
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 md:px-16 pt-32 pb-20">
        <h1 className="text-3xl font-bold mb-8">Akun Saya</h1>

        {!user && (
          <div className="bg-[#fcfcfc] border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold mb-2">Nikmati Diskon Spesial dan Pantau Pesanan Kamu</h2>
              <p className="text-sm text-[#777777] leading-relaxed">
                Dapatkan diskon eksklusif sambil melacak pesanan dan percakapan kamu dengan mudah. Tetap terhubung dengan kami dan selalu tahu perkembangan pembelian kamu, semua dalam satu platform.
              </p>
            </div>
            <div className="flex gap-4 shrink-0 w-full md:w-auto">
              <button 
                onClick={() => navigate('/login')}
                className="flex-1 md:flex-none px-8 py-2.5 border border-[#d4af37] text-[#d4af37] font-medium rounded-full hover:bg-[#d4af37]/5 transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="flex-1 md:flex-none px-8 py-2.5 bg-[#d4af37] text-white font-medium rounded-full hover:bg-[#c4a133] transition-colors"
              >
                Daftar
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#fcfcfc] border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('pesanan')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'pesanan' ? 'border-b-2 border-[#1a1c1b] text-[#1a1c1b]' : 'text-[#777777] hover:text-[#1a1c1b]'}`}
            >
              Pesanan
            </button>
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'wishlist' ? 'border-b-2 border-[#1a1c1b] text-[#1a1c1b]' : 'text-[#777777] hover:text-[#1a1c1b]'}`}
            >
              Wishlist
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'pesanan' && (
              <div>
                <div className="flex justify-between items-center mb-16">
                  <h3 className="font-bold">Order Saya (0)</h3>
                  <select className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white focus:outline-none focus:border-[#1a1c1b]">
                    <option>Semua status</option>
                    <option>Menunggu Pembayaran</option>
                    <option>Diproses</option>
                    <option>Dikirim</option>
                    <option>Selesai</option>
                  </select>
                </div>
                
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package size={48} strokeWidth={1} className="text-[#a0a0a0] mb-4" />
                  <h4 className="font-bold mb-2">Tidak ada pesanan</h4>
                  <p className="text-sm text-[#777777]">Silakan buat pesanan untuk melihatnya disini.</p>
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <h4 className="font-bold mb-2">Wishlist Kosong</h4>
                <p className="text-sm text-[#777777]">Belum ada produk di wishlist Anda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <Cart />
      <AdminModal />
    </motion.div>
  );
}

function ProductDetail({ user }: { user: User | null }) {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const { addToCart, setCartOpen } = useStore();

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'products', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
    });
    return () => unsubscribe();
  }, [id]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    setCartOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="w-full min-h-screen bg-white text-[#1a1c1b] flex flex-col"
    >
      <Navbar user={user} />
      <div className="flex-1 max-w-7xl mx-auto w-full px-8 md:px-16 pt-32 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="w-full aspect-[3/4] bg-[#f4f4f2]">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover grayscale-[0.1]" />
          </div>
          <div className="flex flex-col pt-8">
            <div className="mb-6">
              <span className="inline-block bg-black text-white text-[10px] font-bold px-3 py-1 mb-4 uppercase tracking-widest">In Stock</span>
              <h1 className="text-2xl font-medium mb-4">{product.name}</h1>
              <p className="text-lg">Rp {product.price.toLocaleString('id-ID')}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-medium mb-4">Size</h3>
              <div className="flex gap-4">
                {['S', 'M', 'L', 'XL'].map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex flex-col items-center gap-2 p-2 border ${selectedSize === size ? 'border-black' : 'border-transparent hover:border-gray-200'} transition-colors`}
                  >
                    <div className="w-12 h-12 bg-[#f4f4f2]">
                      <img src={product.imageUrl} alt={size} className="w-full h-full object-cover grayscale-[0.1]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest">{size}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center border border-gray-300 w-fit mb-8">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 hover:bg-gray-50 transition-colors"><Minus size={16} /></button>
              <span className="px-6 py-3 border-x border-gray-300 text-sm">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 hover:bg-gray-50 transition-colors"><Plus size={16} /></button>
            </div>

            <div className="flex flex-col gap-4 mb-12">
              <button onClick={handleAddToCart} className="w-full py-4 border border-black text-sm font-bold hover:bg-gray-50 transition-colors">
                Add to Cart
              </button>
              <button onClick={handleAddToCart} className="w-full py-4 bg-black text-white text-sm font-bold hover:bg-black/80 transition-colors">
                Buy It Now
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-[#444444]">
              <p>{product.description}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <Cart />
      <AdminModal />
    </motion.div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/account');
    } catch (error) {
      console.error("Auth error:", error);
      alert("Authentication failed. Please check your credentials.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/account');
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="w-full min-h-screen bg-[#f9f9f7] text-[#1a1c1b] flex flex-col"
    >
      <Navbar user={null} />
      <div className="flex-1 flex items-center justify-center px-8 py-32">
        <div className="w-full max-w-md bg-white p-8 md:p-12 shadow-sm">
          <h1 className="text-2xl font-bold mb-8 text-center">{isLogin ? 'Masuk' : 'Daftar'}</h1>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[#1a1c1b] transition-colors"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Kata sandi" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[#1a1c1b] transition-colors"
              />
            </div>
            
            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-xs text-[#777777] hover:text-[#1a1c1b] transition-colors">
                  Lupa kata sandi?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-[#1a1c1b] text-white py-4 text-xs uppercase tracking-widest hover:bg-black/80 transition-colors"
            >
              {isLogin ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-[#777777] uppercase tracking-widest">Atau</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 bg-white text-[#1a1c1b] py-4 text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Masuk dengan Google
          </button>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-[#777777] hover:text-[#1a1c1b] transition-colors"
            >
              {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </motion.div>
  );
}

function AppRoutes({ user }: { user: User | null }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {/* @ts-expect-error key is a valid React prop but not in RoutesProps */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/home" element={<Home user={user} />} />
        <Route path="/catalog" element={<Catalog user={user} />} />
        <Route path="/product/:id" element={<ProductDetail user={user} />} />
        <Route path="/news" element={<NewsPage user={user} />} />
        <Route path="/about" element={<AboutPage user={user} />} />
        <Route path="/account" element={<Account user={user} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}


