import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Shield, TrendingUp, Sparkles, Lock, Eye, Heart } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Users,
      title: "Collaborative Learning",
      description: "Teachers and students work together with AI assistance in real-time",
      color: "text-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Stake & Earn",
      description: "Fair incentive system where reputation is earned through participation",
      color: "text-green-600"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Recommendations",
      description: "Get personalized task suggestions with transparent explanations",
      color: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Ethical by Design",
      description: "Privacy-first with full data control and algorithmic transparency",
      color: "text-orange-600"
    }
  ];

  const stats = [
    { label: "Tasks Created", value: "1,234" },
    { label: "Active Students", value: "5,678" },
    { label: "Rewards Earned", value: "89K EDU" },
    { label: "Success Rate", value: "78%" }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-0 bg-grid-zinc-900/[0.04] dark:bg-grid-zinc-50/[0.02]" />
        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Education in the Era of Technology
            </Badge>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Learn, Stake, and Earn in Web3
            </h1>

            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              A decentralized platform where teachers create educational tasks and students solve them.
              Fair incentives through staking, AI-powered personalization, and complete transparency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Get Started
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose EduChain?</h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Built with ethics, transparency, and the future of education in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4 ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Three simple steps to start learning or teaching
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Connect your MetaMask or any Web3 wallet to get started
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Role</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Be a teacher creating tasks or a student solving challenges
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Stake & Learn</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Stake tokens, complete tasks, and earn rewards through learning
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ethics & Transparency */}
      <section className="py-24 bg-white dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Ethics & Transparency</h2>
              <p className="text-xl text-zinc-600 dark:text-zinc-400">
                Your data, your control. Always.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Eye className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Full Transparency</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Every algorithmic decision is explained in plain language
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Lock className="w-8 h-8 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Data Privacy</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    View, export, or delete your data anytime. No questions asked.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Heart className="w-8 h-8 text-red-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Fair System</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Reputation earned through participation, not purchased
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students and teachers already on the platform
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary">
              Launch App
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
