import WeeklyAllocationBoard from '@/components/tasks/kanban/WeeklyAllocationBoard'

export const metadata = {
    title: 'תכנון שבועי | ניהול משימות משפחתי',
    description: 'לוח תכנון שבועי והקצאת משימות לילדי המשפחה בגרירה',
}

export default function PlanningPage() {
    return <WeeklyAllocationBoard />
}
