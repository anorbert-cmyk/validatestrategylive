import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  CreditCard, 
  Wallet, 
  ArrowLeft, 
  Shield, 
  Lock,
  Loader2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

const TIER_INFO = {
  standard: { name: "Observer", price: 29, badge: "tier-badge-standard" },
  medium: { name: "Insider", price: 79, badge: "tier-badge-medium" },
  full: { name: "Syndicate", price: 199, badge: "tier-badge-full" },
};

export default function Checkout() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "coinbase" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: session, isLoading: sessionLoading } = trpc.session.get.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: paymentConfig } = trpc.config.getPaymentConfig.useQuery();

  const createStripeIntent = trpc.payment.createStripeIntent.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Checkout or handle client-side
      toast.success("Redirecting to payment...");
      // In production, you'd use Stripe.js to handle the payment
      // For now, we'll simulate success
      navigate(`/payment/processing/${sessionId}`);
    },
    onError: (error) => {
      toast.error("Payment failed", { description: error.message });
      setIsProcessing(false);
    },
  });

  const createCoinbaseCharge = trpc.payment.createCoinbaseCharge.useMutation({
    onSuccess: (data) => {
      if (data.hostedUrl) {
        window.location.href = data.hostedUrl;
      }
    },
    onError: (error) => {
      toast.error("Payment failed", { description: error.message });
      setIsProcessing(false);
    },
  });

  const handlePayment = async (method: "stripe" | "coinbase") => {
    if (!session) return;
    
    setPaymentMethod(method);
    setIsProcessing(true);

    if (method === "stripe") {
      createStripeIntent.mutate({
        sessionId: session.sessionId,
        tier: session.tier as "standard" | "medium" | "full",
        problemStatement: session.problemStatement,
      });
    } else {
      createCoinbaseCharge.mutate({
        sessionId: session.sessionId,
        tier: session.tier as "standard" | "medium" | "full",
        problemStatement: session.problemStatement,
      });
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Session not found</p>
            <Button className="mt-4" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierInfo = TIER_INFO[session.tier as keyof typeof TIER_INFO];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container flex items-center h-16">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
                <p className="text-muted-foreground mt-1">
                  Secure checkout powered by Stripe and Coinbase
                </p>
              </div>

              <Card className="glass-panel">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                    <span className={`tier-badge ${tierInfo.badge}`}>
                      {tierInfo.name}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Problem Statement</p>
                    <p className="text-sm bg-muted/50 rounded-lg p-3 line-clamp-4">
                      {session.problemStatement}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{tierInfo.name} Analysis</span>
                      <span>${tierInfo.price}.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span>$0.00</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-xl">${tierInfo.price}.00</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Badge */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <Shield className="h-5 w-5 text-green-500" />
                <div className="text-sm">
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-muted-foreground">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>
                
                <div className="space-y-4">
                  {/* Stripe */}
                  {paymentConfig?.stripeEnabled && (
                    <Card 
                      className={`cursor-pointer transition-all ${
                        paymentMethod === "stripe" 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => !isProcessing && setPaymentMethod("stripe")}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Credit / Debit Card</p>
                            <p className="text-sm text-muted-foreground">
                              Pay securely with Stripe
                            </p>
                          </div>
                          {paymentMethod === "stripe" && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Coinbase */}
                  {paymentConfig?.coinbaseEnabled && (
                    <Card 
                      className={`cursor-pointer transition-all ${
                        paymentMethod === "coinbase" 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => !isProcessing && setPaymentMethod("coinbase")}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-orange-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Cryptocurrency</p>
                            <p className="text-sm text-muted-foreground">
                              Pay with BTC, ETH, USDC via Coinbase
                            </p>
                          </div>
                          {paymentMethod === "coinbase" && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!paymentConfig?.stripeEnabled && !paymentConfig?.coinbaseEnabled && (
                    <Card className="border-destructive/50">
                      <CardContent className="pt-6 text-center">
                        <p className="text-destructive">
                          Payment methods are not configured. Please contact support.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Pay Button */}
              <Button
                className="w-full btn-primary h-12 text-lg"
                disabled={!paymentMethod || isProcessing}
                onClick={() => paymentMethod && handlePayment(paymentMethod)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Pay ${tierInfo.price}.00
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
