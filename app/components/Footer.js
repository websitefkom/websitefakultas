import Image from "next/image";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaTwitter, FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-gradient-to-b from-blue-900 to-blue-950 text-white pt-20 pb-16 md:pt-24 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Info Kampus & Sosial Media */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <Image 
                src="https://pmb.masoemuniversity.com/new2/img/Logo%20MU%20Baru3.png" 
                alt="Logo" 
                width={60} 
                height={60}
                className="transform hover:scale-105 transition-transform duration-300"
                style={{ height: 'auto' }}
              />
              <div className="border-l-2 border-blue-400 pl-4">
                <h4 className="font-bold text-2xl text-white">Ma&#39;soem University</h4>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <FaMapMarkerAlt className="mt-1 text-blue-300 group-hover:text-yellow-400 transition-colors" />
                <p className="text-sm text-gray-300">Jl. Raya Cipacing No. 22 Jatinangor 45363 Jawa Barat</p>
              </div>
              <div className="flex items-center space-x-3 group">
                <FaPhoneAlt className="text-blue-300 group-hover:text-yellow-400 transition-colors" />
                <p className="text-sm text-gray-300">022 7798340</p>
              </div>
              <div className="flex items-center space-x-3 group">
                <FaEnvelope className="text-blue-300 group-hover:text-yellow-400 transition-colors" />
                <p className="text-sm text-gray-300">info@masoemuniversity.ac.id</p>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              {[
                { icon: FaTwitter, href: "https://twitter.com/masoem_univ" },
                { icon: FaFacebookF, href: "https://www.facebook.com/masoem.university/" },
                { icon: FaYoutube, href: "https://www.youtube.com/channel/UCO1VjdbEQokcf2iijBckC7A" },
                { icon: FaInstagram, href: "#" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-800/50 hover:bg-yellow-400 text-white hover:text-blue-900 transition-all duration-300 transform hover:scale-110"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Terkait */}
          <div className="space-y-6">
            <h4 className="font-bold text-xl text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-16 after:h-1 after:bg-yellow-400">
              Link Terkait
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Ma'soem University", href: "https://masoemuniversity.ac.id/" },
                { name: "Siakad", href: "https://siakad.masoemuniversity.ac.id/" },
                { name: "Perpustakaan", href: "https://library.masoemuniversity.ac.id/" },
                { name: "Yayasan Al Ma'soem Bandung", href: "https://almasoem.sch.id/" },
                { name: "Al Ma'soem Group", href: "https://masoem.com/" }
              ].map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center group"
                  >
                    <span className="transform group-hover:translate-x-2 transition-transform">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Google Maps */}
          <div className="space-y-6">
            <h4 className="font-bold text-xl text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-16 after:h-1 after:bg-yellow-400">
              Lokasi Kami
            </h4>
            <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.51854548741!2d107.75673711535745!3d-6.947992569951429!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68c3615968483b%3A0xabdf2ae214134ef7!2sMa&#39;soem%20University!5e0!3m2!1sid!2sid!4v1631158361214!5m2!1sid!2sid"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Ma&#39;soem University"
                className="w-full"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-blue-800/30">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Fakultas Komputer Ma&#39;soem University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
