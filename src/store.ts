import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt?: any;
}

export interface CommunityItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  order: number;
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  excerpt: string;
  order: number;
}

export interface AboutContent {
  id: string;
  paragraphs: string[];
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface AppState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  isAdminModalOpen: boolean;
  setAdminModalOpen: (isOpen: boolean) => void;
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (isAuthenticated: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  cart: [],
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    )
  })),
  clearCart: () => set({ cart: [] }),
  isCartOpen: false,
  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  isAdminModalOpen: false,
  setAdminModalOpen: (isOpen) => set({ isAdminModalOpen: isOpen }),
  isAdminAuthenticated: false,
  setAdminAuthenticated: (isAuthenticated) => set({ isAdminAuthenticated: isAuthenticated }),
}));
