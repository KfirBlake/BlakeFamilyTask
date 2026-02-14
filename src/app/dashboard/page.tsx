export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">ברוכים הבאים ל-FamilyTask!</h1>
            <p className="text-gray-600">
                כאן תוכלו לנהל את המשימות של המשפחה, לאשר משימות, ולנהל את חנות הפרסים.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-2">מצב הכוכבים</h2>
                    <div className="text-3xl font-bold text-yellow-500 flex items-center gap-2">
                        -- <span className="text-sm text-gray-400 font-normal">(בקרוב)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
