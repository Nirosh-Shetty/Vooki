"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  BuildingIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      id: "influencer",
      title: "Creator",
      subtitle: "Collab with Brands",
      icon: UserIcon,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "brand",
      title: "Brand",
      subtitle: "Find creators",
      icon: BuildingIcon,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "manager",
      title: "Manager",
      subtitle: "Manage talent",
      icon: BriefcaseIcon,
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const handleSocialSignup = (provider: string) => {
    if (!selectedRole) return;
    if (provider === "google") {
      window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google?role=${selectedRole}`;
    } else if (provider === "facebook") {
      window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/facebook?role=${selectedRole}`;
    }
  };

  const handleLocalSignup = () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    sessionStorage.setItem("selectedRole", selectedRole);
    router.push("/signup/details");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[color:var(--vooki-app-bg)]">
      {/* Left Panel — dark brand showcase */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#2d3a1e] via-[#3a4d24] to-[#4a3d6b] p-10 flex-col justify-between">
        {/* Abstract blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[120px]" />
          <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-white/10 blur-[80px]" />

          {/* Glassmorphic card 1 */}
          <div className="absolute top-[30%] left-[10%] w-60 h-28 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 transform -rotate-6 shadow-2xl opacity-60 flex flex-col justify-center px-5">
            <div className="h-2 w-14 bg-white/40 rounded-full mb-2.5"></div>
            <div className="h-2 w-28 bg-white/20 rounded-full mb-2.5"></div>
            <div className="h-2 w-20 bg-white/20 rounded-full"></div>
          </div>
          {/* Glassmorphic card 2 */}
          <div className="absolute bottom-[30%] right-[5%] w-64 h-36 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 transform rotate-3 shadow-2xl opacity-70 flex items-center px-5 gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-white/40 to-white/10 shrink-0"></div>
            <div className="space-y-2.5 w-full">
              <div className="h-2 w-full bg-white/20 rounded-full"></div>
              <div className="h-2 w-2/3 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="bg-white text-[color:var(--vooki-accent-text)] p-2 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Vooki</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-5 max-w-lg mb-8">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight">
            Connect. <br /> Collaborate. <br /> <span className="text-white/70">Create impact.</span>
          </h1>
          <p className="text-base text-white/70 font-medium leading-relaxed max-w-md">
            Join the premium ecosystem where top brands and visionary creators build authentic campaigns together.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-[#3a4d24] bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/60 text-xs font-bold">
                  V
                </div>
              ))}
            </div>
            <p className="text-sm text-white/70 font-medium">Trusted by 10,000+ creators</p>
          </div>
        </div>
      </div>

      {/* Right Panel — form, no scroll */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 overflow-y-auto py-6 scrollbar-hide">
        <div className="mx-auto w-full max-w-md space-y-4">

          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[color:var(--vooki-app-text-strong)] tracking-tight">Join Vooki</h2>
            <p className="text-[color:var(--vooki-app-text-soft)] text-sm">Choose how you&apos;ll use our platform.</p>
          </div>

          {/* Role Selection — compact */}
          <div className="space-y-2.5">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full p-3.5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? "border-[color:var(--vooki-accent)] bg-[color:var(--vooki-accent)]/5 shadow-md scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3.5 transition-colors ${
                        isSelected
                          ? `bg-gradient-to-br ${role.gradient} shadow-lg text-white`
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold transition-colors ${isSelected ? "text-[color:var(--vooki-app-text-strong)]" : "text-gray-700"}`}>
                        {role.title}
                      </h3>
                      <p className={`text-sm transition-colors ${isSelected ? "text-[color:var(--vooki-app-text-soft)]" : "text-gray-500"}`}>
                        {role.subtitle}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto">
                        <div className="w-6 h-6 rounded-full bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions — compact */}
          <div className="space-y-2.5">
            <Button
              onClick={handleLocalSignup}
              disabled={!selectedRole || isSubmitting}
              className="w-full bg-[color:var(--vooki-accent)] hover:bg-[color:var(--vooki-accent-strong)] text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] rounded-xl font-semibold h-11 text-base transition-all hover:-translate-y-0.5 group disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                "Getting started..."
              ) : (
                <>
                  Continue with Email
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[color:var(--vooki-app-border-strong)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[color:var(--vooki-app-bg)] px-4 text-[color:var(--vooki-app-text-muted)] font-medium">
                  Or register with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleSocialSignup("google")}
                disabled={!selectedRole}
                variant="outline"
                className="w-full bg-white border-[color:var(--vooki-app-border-strong)] hover:bg-gray-50 text-[color:var(--vooki-app-text-strong)] font-semibold rounded-xl h-11 transition-all hover:shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
                </svg>
                Google
              </Button>
              <Button
                onClick={() => handleSocialSignup("facebook")}
                disabled={!selectedRole}
                variant="outline"
                className="w-full bg-white border-[color:var(--vooki-app-border-strong)] hover:bg-gray-50 text-[color:var(--vooki-app-text-strong)] font-semibold rounded-xl h-11 transition-all hover:shadow-sm"
              >
                <svg className="w-5 h-5 mr-2 text-blue-600 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-[color:var(--vooki-app-text-soft)]">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
