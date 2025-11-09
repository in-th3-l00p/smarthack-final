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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - MetaMask Style with Mesh Gradient */}
      <section className="relative overflow-hidden mesh-gradient border-b border-border/50 min-h-[90vh] flex items-center">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Floating Badge */}
            <div className="inline-block mb-8 float">
              <Badge variant="secondary" className="liquid-glass text-primary border-primary/20 px-4 py-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Education in the Era of Technology
              </Badge>
            </div>

            {/* Animated Title */}
            <div className="mb-8">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-center">
                <span className="block bg-gradient-to-r from-primary via-secondary to-primary animate-gradient-shift bg-clip-text text-transparent animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  Learn, Stake and Earn
                </span>
                <span className="block bg-gradient-to-r from-accent via-primary to-secondary animate-gradient-shift bg-clip-text text-transparent mt-2 animate-scale-in" style={{ animationDelay: '0.3s' }}>
                  in Web3
                </span>
              </h1>
            </div>

            <p className="text-xl sm:text-2xl text-foreground/80 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in">
              A decentralized platform where <span className="text-primary font-bold">teachers</span> create educational tasks and <span className="text-primary font-bold">students</span> solve them.
              <br />
              <span className="text-muted-foreground text-lg mt-2 block">
                Fair incentives through staking, AI-powered personalization, and complete transparency.
              </span>
            </p>

            {/* Liquid Glass Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Link href="/dashboard" className="w-full sm:w-auto flex justify-center">
                <button className="liquid-glass px-8 py-4 rounded-2xl text-lg font-semibold text-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 min-w-[200px] shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20">
                  <BookOpen className="w-5 h-5" />
                  Get Started
                </button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto flex justify-center">
                <button className="liquid-glass px-8 py-4 rounded-2xl text-lg font-semibold text-foreground hover:text-secondary transition-colors flex items-center justify-center gap-2 min-w-[200px]">
                  <Sparkles className="w-5 h-5" />
                  Learn More
                </button>
              </Link>
            </div>

            {/* Stats - Improved Glass Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="liquid-glass rounded-2xl p-6 hover-lift animate-slide-in group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-shift bg-clip-text text-transparent">
              Why Choose EduChain?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with ethics, transparency, and the future of education in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="liquid-glass rounded-3xl p-8 hover-lift group animate-slide-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex flex-col space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all group-hover:scale-110">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{feature.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 mesh-gradient border-y border-border/50 relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to start learning or teaching
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="liquid-glass rounded-3xl p-8 hover-lift group relative overflow-hidden">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all">
                <span className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">1</span>
              </div>
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Connect Wallet</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Connect your MetaMask or any Web3 wallet to get started
                </p>
              </div>
            </div>

            <div className="liquid-glass rounded-3xl p-8 hover-lift group relative overflow-hidden">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center ring-2 ring-secondary/30 group-hover:ring-secondary/50 transition-all">
                <span className="text-2xl font-bold bg-gradient-to-br from-secondary to-primary bg-clip-text text-transparent">2</span>
              </div>
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Choose Your Role</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Be a teacher creating tasks or a student solving challenges
                </p>
              </div>
            </div>

            <div className="liquid-glass rounded-3xl p-8 hover-lift group relative overflow-hidden">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center ring-2 ring-accent/30 group-hover:ring-accent/50 transition-all">
                <span className="text-2xl font-bold bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">3</span>
              </div>
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Stake & Learn</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stake tokens, complete tasks, and earn rewards through learning
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ethics & Transparency */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-shift bg-clip-text text-transparent">
                Ethics & Transparency
              </h2>
              <p className="text-xl text-muted-foreground">
                Your data, your control. Always.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center liquid-glass rounded-3xl p-8 hover-lift group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all group-hover:scale-110">
                  <Eye className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-bold mb-3 text-xl text-foreground">Full Transparency</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Every algorithmic decision is explained in plain language
                </p>
              </div>

              <div className="text-center liquid-glass rounded-3xl p-8 hover-lift group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center mx-auto mb-6 ring-2 ring-secondary/30 group-hover:ring-secondary/50 transition-all group-hover:scale-110">
                  <Lock className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="font-bold mb-3 text-xl text-foreground">Data Privacy</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  View, export, or delete your data anytime. No questions asked.
                </p>
              </div>

              <div className="text-center liquid-glass rounded-3xl p-8 hover-lift group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center mx-auto mb-6 ring-2 ring-accent/30 group-hover:ring-accent/50 transition-all group-hover:scale-110">
                  <Heart className="w-10 h-10 text-accent" />
                </div>
                <h3 className="font-bold mb-3 text-xl text-foreground">Fair System</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Reputation earned through participation, not purchased
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden gradient-animate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute top-10 left-20 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-2000" />

        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white">
            Ready to Start Learning?
          </h2>
          <p className="text-xl sm:text-2xl mb-12 text-white/90 max-w-2xl mx-auto">
            Join thousands of students and teachers already on the platform
          </p>
          <Link href="/dashboard">
            <button className="liquid-glass px-10 py-5 rounded-2xl text-xl font-bold text-white hover:text-primary-foreground transition-colors flex items-center justify-center gap-3 mx-auto min-w-[250px] bg-white/10 hover:bg-white/20 glow">
              <BookOpen className="w-6 h-6" />
              Launch App
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
