import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const requestMagicLink = trpc.auth.requestMagicLink.useMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);

        try {
            await requestMagicLink.mutateAsync({ email });
            setIsSent(true);
            toast.success("Magic link sent!", {
                description: "Check your email to log in."
            });
        } catch (error: any) {
            console.error("Magic link request failed:", error);
            toast.error("Failed to send magic link", {
                description: error.message || "Please try again later."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setIsSent(false);
        setEmail("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-mono uppercase tracking-wide">
                        {isSent ? "Check your email" : "Sign in with Email"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-mono text-xs">
                        {isSent
                            ? `We sent a magic link to ${email}`
                            : "Enter your email for a passwordless login link."}
                    </DialogDescription>
                </DialogHeader>

                {isSent ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground max-w-[260px]">
                            Click the link in the email to return here and sign in automatically.
                        </p>
                        <Button variant="outline" onClick={handleReset} className="mt-2 w-full">
                            Close
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="founder@startup.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSubmitting}
                                className="font-mono bg-muted/50 border-input"
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full font-mono uppercase tracking-wider"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Magic Link"
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
