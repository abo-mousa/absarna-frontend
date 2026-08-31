import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, User, Shield, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.svg';

const iconButtonClass = 'flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors';
const iconLabelClass = 'hidden sm:block text-[0.65rem] font-medium text-text-muted';

function Navbar({ onMenuClick }) {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

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
                    <form onSubmit={handleSearch} className="w-full max-w-[500px] relative">
                        <button
                            type="submit"
                            aria-label="بحث"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                        >
                            <Search size={16} />
                        </button>
                        <input
                            type="text"
                            placeholder="ابحث..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 rounded-full border border-border bg-surface text-sm outline-none focus:border-primary transition-colors"
                        />
                    </form>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {token ? (
                        <>
                            {['CREATOR', 'CHANNEL_ADMIN', 'PLATFORM_ADMIN'].includes(user?.role) && (
                                <Link to="/upload" title="رفع محتوى" className={iconButtonClass}>
                                    <Upload size={18} />
                                    <span className={iconLabelClass}>رفع</span>
                                </Link>
                            )}

                            <Link to="/profile" title="الملف الشخصي" className={iconButtonClass}>
                                <User size={18} />
                                <span className={iconLabelClass}>حسابي</span>
                            </Link>

                            {user?.role === 'PLATFORM_ADMIN' && (
                                <Link to="/admin" title="لوحة التحكم" className={`${iconButtonClass} bg-primary-dark text-white hover:bg-primary-dark/90`}>
                                    <Shield size={18} />
                                    <span className="hidden sm:block text-[0.65rem] font-medium text-white">الإدارة</span>
                                </Link>
                            )}

                            <button onClick={logout} title="تسجيل الخروج" className={`${iconButtonClass} bg-surface-hover border border-border`}>
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
