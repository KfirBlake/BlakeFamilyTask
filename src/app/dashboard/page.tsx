import FamilyOverview from '@/components/dashboard/FamilyOverview'

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">ברוכים הבאים ל-FamilyTask!</h1>

            <FamilyOverview />
        </div>
    )
}
