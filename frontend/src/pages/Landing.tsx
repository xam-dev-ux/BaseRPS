import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useMatchCounter, useOpenMatchCount } from '@/contracts/hooks/useBaseRPS';

export function Landing() {
  const { isConnected } = useAccount();
  const { data: totalMatches } = useMatchCounter();
  const { data: openMatches } = useOpenMatchCount();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/50 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Battle for ETH</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              PvP Rock Paper Scissors on Base Network.
              Commit-reveal mechanics, overtime system, and instant payouts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <Link to="/play" className="btn btn-primary py-3 px-8 text-lg">
                  Start Playing
                </Link>
              ) : (
                <ConnectButton />
              )}
              <a
                href="#how-it-works"
                className="btn btn-secondary py-3 px-8 text-lg"
              >
                How It Works
              </a>
            </div>
          </motion.div>

          {/* Choice Preview */}
          <motion.div
            className="flex justify-center gap-8 mt-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {['🪨', '📄', '✂️'].map((emoji, index) => (
              <motion.div
                key={emoji}
                className="w-24 h-24 rounded-2xl bg-gray-800/50 border border-gray-700 flex items-center justify-center text-5xl"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  delay: index * 0.2,
                  repeat: Infinity,
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-800/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Matches', value: totalMatches?.toString() || '0' },
              { label: 'Open Matches', value: openMatches?.toString() || '0' },
              { label: 'Commission', value: '2.5%' },
              { label: 'Network', value: 'Base' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary-400">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="space-y-12">
            {[
              {
                step: 1,
                title: 'Create or Join',
                description: 'Create a new match with your bet amount or join an existing one. Choose between Best of 1, 3, or 5 rounds.',
                icon: '🎯',
              },
              {
                step: 2,
                title: 'Commit Your Choice',
                description: 'Select Rock, Paper, or Scissors. Your choice is encrypted and submitted to the blockchain.',
                icon: '🔒',
              },
              {
                step: 3,
                title: 'Reveal',
                description: 'Once both players commit, reveal your choices. The smart contract verifies and determines the winner.',
                icon: '🎭',
              },
              {
                step: 4,
                title: 'Overtime!',
                description: 'If you tie, it goes to overtime! Up to 10 ties per round, then the match is a draw with full refunds.',
                icon: '🔥',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                className="flex gap-6 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 rounded-full bg-primary-900 border-2 border-primary-500 flex items-center justify-center text-2xl shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    <span className="text-primary-400 mr-2">{item.step}.</span>
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-primary-950/30 to-transparent">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Battle?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Connect your wallet and start playing. Minimum bet is just 0.00001 ETH.
          </p>
          {isConnected ? (
            <Link to="/play" className="btn btn-primary py-3 px-8 text-lg">
              Find a Match
            </Link>
          ) : (
            <ConnectButton />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500">BaseRPS - Built on Base Network</p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <a
                href="https://github.com/xabierbr/BaseRPS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
