import React from 'react'
import { assets } from '../assets/assets'
import { Phone, MessageSquareHeart } from 'lucide-react'

const Footer = () => {
  const hasNavbar = location.pathname === '/' || location.pathname === '/home'
  return (
    <footer className="px-6 md:px-16 mt-2 lg:px-24 xl:px-32 pt-8 w-full bg-gradient-to-b from-[#014d4e] to-[#003333]  relative text-gray-50">
      {/* Row 1: Logo and Description */}
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-amber-500/30 pb-6">
        <div className="md:max-w-96  ">
                          <img src={assets.logo} alt="Logo" className=' w-40 h-auto  mb-1 '/>
          <p className="text-sm">
            Century Cinema isn’t just the top destination for movies—it’s also the perfect venue for your next big meeting! With our exceptional screens and sound systems, you can be sure that your message will be seen and heard clearly.
          </p>
        </div>
         <div className="w-full md:w-[400px] lg:w-[450px] h-64 md:h-72 rounded-xl overflow-hidden shadow-2xl border-2 border-ambe-400/ transition-all duration-300">
  <iframe
    title="Century Mall Location"
    src="https://www.google.com/maps?q=Century+Mall,+Addis+Ababa,+Ethiopia&output=embed"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    allowFullScreen=""
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
</div>
      </div>
 




      {/* Row 2: Company and Contact */}
      <div className="flex flex-col md:flex-row justify-between w-full gap-20 mt-6">
        <div>
      <h2 className="font-semibold mb-5 text-amber-500 drop-shadow-[3px_3px_2px_rgba(0,0,0,0.5)]">
  Company
</h2>

          <ul className="text-sm space-y-2">
            <li><a href="/">Home</a></li>
            <li><a href="/movies">Movies</a></li>
            <li><a href="#">Contact us</a></li>
            <li><a href="#">Privacy policy</a></li>
          </ul>
        </div>
        <div>
        <h2 className="font-semibold mb-5 text-amber-500 drop-shadow-[3px_3px_2px_rgba(0,0,0,0.5)]">Get in touch</h2>
        <div className="space-y-3 text-sm">
  {/* Phone */}
  <div className="flex items-center gap-2">
    <Phone className="w-5 h-5 text-amber-500" />
    <span className="text-gray-100 hover:text-amber-400 transition-colors">
      +1-212-456-7890
    </span>
  </div>

  {/* Email / Message */}
  <div className="flex items-center gap-2">
    <MessageSquareHeart className="w-5 h-5 text-amber-500" />
    <a
      href="mailto:centuryW@gmail.com"
      className="text-gray-100 hover:text-amber-400 transition-colors"
    >
      centuryW@gmail.com
    </a>
  </div>
</div>

        </div>
      </div>

      {/* Row 3: Social Icons (Centered) */}
      <div className="flex justify-center gap-4 mt-6">
        {/* Facebook */}
        <a href="#" className="hover:-translate-y-0.5 transition-all duration-300">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        {/* Instagram */}
        <a href="#" className="hover:-translate-y-0.5 transition-all duration-300">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 11.37a4 4 0 1 1-7.914 1.173A4 4 0 0 1 16 11.37m1.5-4.87h.01" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        {/* Telegram */}
        <a href="#" className="hover:-translate-y-0.5 transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="none">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <div className="flex justify-center gap-4 mt-5">
        <span> Developed by:</span>
        
        <a href="https://ezana-portfolio.netlify.app/" className='underline hover:text-blue-400 '><span>Ez Tech</span></a>
        

      </div>

      <p className="pt-4 text-center text-xs md:text-sm pb-5">
        ©2025-{new Date().getFullYear()} <a href="/">Century Cinema</a>. All Right Reserved.
      </p>
    </footer>
  )
}

export default Footer
