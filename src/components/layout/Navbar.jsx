import { Link } from 'react-router-dom';
import { Upload, User, Shield, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isPlatformAdmin } from '@/lib/user';
import logo from '../../assets/logo.svg';
import SearchBar from './SearchBar';

const iconButtonClass = 'flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors';
const iconLabelClass = 'hidden sm:block text-[0.65rem] font-medium text-text-muted';

function Navbar({ onMenuClick }) {
    const { token, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="sticky top-0 z-[1000] bg-bg/95 backdrop-blur-md border-b border-border-light">
            <div className="max-w-[1400px] mx-auto flex items-center gap-3 sm:gap-5 px-3 sm:px-6 py-2.5">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-text-secondary p-1.5 -mr-1 rounded-md hover:bg-surface-hover flex-shrink-0"
                    aria-label="القائمة"
                >
                    <Menu size={22} />
                </button>

                <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary flex-shrink-0">
                    <img src={logo} alt="منارة" className="w-7 h-7" />
                    <span>منارة</span>
                </Link>

                <div className="flex-1 flex justify-center">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
                        aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
                        className={iconButtonClass}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span className={iconLabelClass}>{theme === 'dark' ? 'فاتح' : 'داكن'}</span>
                    </button>

                    {token ? (
                        <>
                            {['CREATOR', 'CHANNEL_ADMIN', 'PLATFORM_ADMIN'].includes(user?.role) && (
                                <Link to="/upload" title="رفع محتوى" aria-label="رفع محتوى" className={iconButtonClass}>
                                    <Upload size={18} />
                                    <span className={iconLabelClass}>رفع</span>
                                </Link>
                            )}

                            <Link to="/profile" title="الملف الشخصي" aria-label="الملف الشخصي" className={iconButtonClass}>
                                <User size={18} />
                                <span className={iconLabelClass}>حسابي</span>
                            </Link>

                            {isPlatformAdmin(user) && (
                                <Link to="/admin" title="لوحة التحكم" aria-label="لوحة التحكم" className={`${iconButtonClass} bg-primary-dark text-white hover:bg-primary-dark/90`}>
                                    <Shield size={18} />
                                    <span className="hidden sm:block text-[0.65rem] font-medium text-white">الإدارة</span>
                                </Link>
                            )}

                            <button onClick={logout} title="تسجيل الخروج" aria-label="تسجيل الخروج" className={`${iconButtonClass} bg-surface-hover border border-border`}>
                                <LogOut size={18} />
                                <span className={iconLabelClass}>خروج</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-4 sm:px-5 py-2 bg-primary text-white rounded-full font-semibold text-sm whitespace-nowrap">
                                دخول
                            </Link>
                            <Link to="/register" className="hidden sm:block px-5 py-2 bg-primary-light text-primary border border-primary rounded-full font-semibold text-sm whitespace-nowrap">
                                إنشاء حساب
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
