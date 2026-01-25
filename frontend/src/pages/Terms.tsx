import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-500">Last updated: January 2025</p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BaseRPS ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p>
              BaseRPS is a decentralized application (dApp) that enables users to play Rock Paper Scissors
              against other players with ETH wagers on the Base network. The game uses a commit-reveal
              mechanism to ensure fair play.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and legally permitted to participate in blockchain-based
              gaming in your jurisdiction. You are solely responsible for ensuring compliance with local laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Wallet and Transactions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining the security of your wallet and private keys.</li>
              <li>All transactions on the blockchain are final and irreversible.</li>
              <li>You are responsible for all gas fees associated with your transactions.</li>
              <li>A commission fee (currently 2.5%) is deducted from winning payouts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Game Rules</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Matches can be Best of 1, Best of 3, or Best of 5 rounds.</li>
              <li>Players must commit and reveal their choices within the specified timeouts.</li>
              <li>Failure to reveal within the timeout may result in forfeiture of the match.</li>
              <li>In case of 10 consecutive ties, the match ends in a draw with full refunds.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use bots, scripts, or automated tools to interact with the Service.</li>
              <li>Attempt to exploit vulnerabilities in the smart contracts.</li>
              <li>Engage in collusion with other players.</li>
              <li>Use the Service for money laundering or other illegal activities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE
              UNINTERRUPTED ACCESS OR THAT THE SERVICE WILL BE ERROR-FREE. BLOCKCHAIN TRANSACTIONS
              CARRY INHERENT RISKS INCLUDING BUT NOT LIMITED TO SMART CONTRACT VULNERABILITIES,
              NETWORK CONGESTION, AND PRICE VOLATILITY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including loss of funds, arising from your use
              of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Smart Contract Risks</h2>
            <p>
              You acknowledge that smart contracts may contain bugs or vulnerabilities. While our contracts
              have been designed with security best practices (ReentrancyGuard, commit-reveal pattern, etc.),
              we cannot guarantee they are free from all risks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Service after
              changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws,
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">12. Contact</h2>
            <p>
              For questions about these Terms, please contact us through our official channels.
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
