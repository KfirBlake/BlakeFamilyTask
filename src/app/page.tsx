import Link from "next/link";
import { ArrowLeft, CheckCircle, Star, LayoutDashboard } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col font-sans">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Star size={24} fill="currentColor" />
          </div>
          <span className="text-2xl font-bold text-indigo-900">FamilyTask</span>
        </div>
        <div className="flex gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <LayoutDashboard size={18} />
              לוח בקרה
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-indigo-700 font-medium hover:bg-indigo-100 rounded-lg transition-colors"
              >
                כניסה
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                הרשמה
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          לנהל את מטלות הבית <br />
          <span className="text-indigo-600">בכיף ובקלות!</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          מערכת חכמה לניהול משימות לכל המשפחה. הורים מחלקים משימות, ילדים מבצעים, צוברים כוכבים, ומקבלים פרסים שווים!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
          <Link
            href="/signup"
            className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            התחל עכשיו בחינם
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Features Preview */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-right">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">משימות פשוטות</h3>
            <p className="text-gray-600">
              חלוקת משימות קלה וברורה. הילדים יודעים בדיוק מה עליהם לעשות ומתי.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
              <Star size={24} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">חיזוק חיובי</h3>
            <p className="text-gray-600">
              צוברים כוכבים על כל משימה שבוצעה. הופכים את העזרה בבית למשחק מאתגר!
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
              <Star size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">חנות פרסים</h3>
            <p className="text-gray-600">
              הילדים יכולים להמיר את הכוכבים שצברו בפרסים אמיתיים שההורים הגדירו.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} FamilyTask. כל הזכויות שמורות.
        </div>
      </footer>
    </div>
  );
}
