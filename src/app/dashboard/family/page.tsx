import FamilyMembersList from "@/components/members/FamilyMembersList";

export default function FamilyPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">ניהול משפחה</h1>
                <p className="text-gray-600 mt-2">
                    כאן ניתן לראות את כל חברי המשפחה, להוסיף חברים חדשים, ולנהל את הפרופילים.
                </p>
            </div>

            <FamilyMembersList />
        </div>
    )
}
