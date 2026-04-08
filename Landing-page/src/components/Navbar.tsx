import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-full px-6 py-3 flex items-center justify-between w-full mx-4 md:mx-8 lg:mx-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-white rounded-full"></div>
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">Scrollix</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link to="/" className={`transition-colors ${path === '/' ? 'text-orange-600 font-semibold' : 'hover:text-gray-900'}`}>Trang Chủ</Link>
          <Link to="/about" className={`transition-colors ${path === '/about' ? 'text-orange-600 font-semibold' : 'hover:text-gray-900'}`}>Năng lực</Link>
          <Link to="/services" className={`transition-colors ${path === '/services' ? 'text-orange-600 font-semibold' : 'hover:text-gray-900'}`}>Dịch Vụ</Link>
          <a href="/#experience" className="hover:text-gray-900 transition-colors">Kinh Nghiệm</a>
          <Link to="/contact" className={`transition-colors ${path === '/contact' ? 'text-orange-600 font-semibold' : 'hover:text-gray-900'}`}>Liên Hệ</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/contact" className="hidden md:block bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
            Tư vấn ngay
          </Link>
          <button className="md:hidden p-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
