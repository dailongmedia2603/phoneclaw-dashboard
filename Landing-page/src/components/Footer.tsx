import { Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-24 pb-12 mt-32">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              <span className="font-bold text-2xl tracking-tight">Scrollix</span>
            </div>
            <p className="text-gray-400 mb-8 max-w-sm">
              We turn ambitious brands into viral sensations through strategic, data-driven social media marketing.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">News</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Services</h4>
            <ul className="space-y-4">
              <li><Link to="/services" className="text-gray-400 hover:text-white transition-colors">Seeding Đa Nền Tảng</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-white transition-colors">Xử Lý Khủng Hoảng</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-white transition-colors">Kịch Bản Chuyển Đổi</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-white transition-colors">Tối Ưu Hội Thoại</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Scrollix Agency. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Designed with</span>
            <span className="text-red-500">♥</span>
            <span>by Scrollix</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
