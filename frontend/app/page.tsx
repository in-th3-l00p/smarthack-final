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
      {/* Hero Section - MetaMask Style */}
      <section className="relative overflow-hidden gradient-bg border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(197,230,166,0.15),rgba(255,255,255,0))]" />

        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              <Sparkles className="w-3 h-3 mr-1" />
              Education in the Era of Technology
            </Badge>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent text-center animate-typewriter">
              Learn, Stake, and Earn in Web3
            </h1>

            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              A decentralized platform where teachers create educational tasks and students solve them.
              Fair incentives through staking, AI-powered personalization, and complete transparency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Get Started
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats - Glass Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="glass-card rounded-2xl p-6 hover-lift animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Why Choose EduChain?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with ethics, transparency, and the future of education in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="glass-card rounded-2xl hover-lift border-primary/10 hover:border-primary/30 transition-all"
                >
                  <CardHeader className="space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/20">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground leading-relaxed">
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
      <section className="py-24 gradient-bg border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to start learning or teaching
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect Wallet</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect your MetaMask or any Web3 wallet to get started
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-muted text-secondary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Choose Your Role</h3>
              <p className="text-muted-foreground leading-relaxed">
                Be a teacher creating tasks or a student solving challenges
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Stake & Learn</h3>
              <p className="text-muted-foreground leading-relaxed">
                Stake tokens, complete tasks, and earn rewards through learning
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ethics & Transparency */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">Ethics & Transparency</h2>
              <p className="text-xl text-muted-foreground">
                Your data, your control. Always.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center glass-card rounded-2xl hover-lift border-primary/10">
                <CardContent className="pt-8 pb-8">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/20">
                    <Eye className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Full Transparency</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every algorithmic decision is explained in plain language
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center glass-card rounded-2xl hover-lift border-primary/10">
                <CardContent className="pt-8 pb-8">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-secondary/20">
                    <Lock className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Data Privacy</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    View, export, or delete your data anytime. No questions asked.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center glass-card rounded-2xl hover-lift border-primary/10">
                <CardContent className="pt-8 pb-8">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/20">
                    <Heart className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Fair System</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reputation earned through participation, not purchased
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden" style={{background: 'linear-gradient(135deg, rgb(235, 81, 96) 0%, rgb(170, 170, 170) 100%)'}}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Ready to Start Learning?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of students and teachers already on the platform
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Launch App
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
