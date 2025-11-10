import { Link } from "wouter";
import { Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4" data-testid="footer-logo">LocalFix</h3>
            <p className="text-gray-300 mb-6 max-w-md" data-testid="footer-description">
              Connecting communities with trusted. this is devloped by Aman Sinha. Quality work, reliable service, every time.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.youtube.com/"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on Twitter"
                data-testid="social-twitter"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="https://www.youtube.com/"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on Facebook"
                data-testid="social-facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="https://www.youtube.com/"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Connect with us on LinkedIn"
                data-testid="social-linkedin"
              >
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6" data-testid="footer-customers-title">For Customers</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/services">
                  <span className="text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="footer-browse-services">
                    Browse Services
                  </span>
                </Link>
              </li>
              <li>
                <a href="signin" className="text-gray-300 hover:text-white transition-colors" data-testid="footer-how-it-works">
                  How It Works
                </a>
              </li>
              <li>
                <a href="signin" className="text-gray-300 hover:text-white transition-colors" data-testid="footer-customer-support">
                  Customer Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors" data-testid="footer-safety-guarantee">
                  Safety & Guarantee
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6" data-testid="footer-providers-title">For Providers</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/provider-panel">
                  <span className="text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="footer-join-localfix">
                    Join LocalFix
                  </span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors" data-testid="footer-provider-resources">
                  Provider Resources
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors" data-testid="footer-success-stories">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors" data-testid="footer-provider-support">
                  Provider Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm" data-testid="footer-copyright">
              © 2024 LocalFix. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors" data-testid="footer-privacy">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors" data-testid="footer-terms">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors" data-testid="footer-contact">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}