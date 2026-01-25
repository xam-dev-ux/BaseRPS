import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-500">Last updated: January 2025</p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              BaseRPS ("we", "our", or "the Service") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard information when
              you use our decentralized application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.1 Blockchain Data</h3>
            <p>
              When you interact with BaseRPS, the following information is recorded on the public
              Base blockchain:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your wallet address</li>
              <li>Transaction history (matches created, joined, outcomes)</li>
              <li>Game choices (after reveal phase)</li>
              <li>Bet amounts and payouts</li>
            </ul>
            <p className="mt-4">
              <strong>Note:</strong> Blockchain data is public and immutable. We do not control
              and cannot delete this information.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.2 Local Storage</h3>
            <p>We store the following data locally in your browser:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Game session data (commit salts for reveal phase)</li>
              <li>Sound and notification preferences</li>
              <li>Push notification subscription (if enabled)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.3 Analytics</h3>
            <p>
              We may collect anonymized usage data to improve the Service, including page views,
              feature usage, and error reports. This data does not include personally identifiable
              information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitate gameplay and match resolution</li>
              <li>Display your game statistics and leaderboard position</li>
              <li>Send push notifications about match events (if enabled)</li>
              <li>Improve and optimize the Service</li>
              <li>Prevent fraud and ensure fair play</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information. Information may be shared:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>On the public blockchain as part of normal operation</li>
              <li>With service providers who assist in operating the Service</li>
              <li>When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Data Security</h2>
            <p>
              We implement security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Commit-reveal pattern to protect game choices until both players have committed</li>
              <li>Local storage of sensitive session data (salts never leave your browser)</li>
              <li>HTTPS encryption for all communications</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet is 100% secure. You are
              responsible for securing your wallet and private keys.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Third-Party Services</h2>
            <p>The Service integrates with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Wallet Providers:</strong> (MetaMask, Coinbase Wallet, etc.) - governed by their respective privacy policies</li>
              <li><strong>Base Network:</strong> Public blockchain infrastructure</li>
              <li><strong>Farcaster:</strong> For social features and frames (if used)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your data stored locally and clear it via browser settings</li>
              <li>Disable push notifications at any time</li>
              <li>Use the Service without providing additional personal information</li>
            </ul>
            <p className="mt-4">
              <strong>Note:</strong> Due to the nature of blockchain technology, on-chain data
              cannot be modified or deleted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Cookies</h2>
            <p>
              We use essential cookies and local storage for the Service to function properly.
              We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Children's Privacy</h2>
            <p>
              The Service is not intended for users under 18 years of age. We do not knowingly
              collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of
              significant changes by updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us through our
              official channels.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
