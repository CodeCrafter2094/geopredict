'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Globe, Trophy, User as UserIcon, LogOut, Menu, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/lib/types';

export function Navbar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: 'Harita', icon: Globe },
    { href: '/leaderboard', label: 'Liderlik', icon: Trophy },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-lg" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Globe className="h-8 w-8 text-primary transition-transform group-hover:rotate-45 duration-500" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-colors" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GeoPredict
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {profile?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Crown className="h-4 w-4 text-accent" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href={`/profile/${profile?.username || user.id}`}>
                  <Avatar
                    src={profile?.avatar_url}
                    fallback={profile?.username || user.email}
                    size="md"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Giriş Yap</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Kayıt Ol</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              
              <div className="border-t border-border my-2 pt-2">
                {user ? (
                  <>
                    <Link
                      href={`/profile/${profile?.username || user.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary"
                    >
                      <UserIcon className="h-5 w-5" />
                      Profil
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary"
                      >
                        <Crown className="h-5 w-5 text-accent" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary w-full text-left text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary"
                    >
                      Giriş Yap
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Kayıt Ol
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
