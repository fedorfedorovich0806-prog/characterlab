export default function RulesPage() {
  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-semibold mb-6">Правила CharacterLab</h1>
      <div className="prose prose-sm dark:prose-invert space-y-4 text-sm">
        <p>Используя CharacterLab, ты соглашаешься с этими правилами:</p>

        <h2 className="text-lg font-medium mt-6">1. Запрещённый контент</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Контент с участием несовершеннолетних в сексуальном или насильственном контексте</li>
          <li>Призывы к насилию, терроризму, экстремизму</li>
          <li>Распространение наркотиков и инструкций по их изготовлению</li>
          <li>Доксинг, публикация личных данных других людей</li>
          <li>Мошенничество и обман пользователей</li>
        </ul>

        <h2 className="text-lg font-medium mt-6">2. Персонажи</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Нельзя создавать персонажей, имитирующих реальных людей без их согласия</li>
          <li>Публичные персонажи не должны содержать откровенно сексуальный контент в описании</li>
          <li>Персонажи не должны пропагандировать ненависть к группам людей</li>
        </ul>

        <h2 className="text-lg font-medium mt-6">3. Общение</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Уважай других пользователей</li>
          <li>Не спамь и не злоупотребляй сервисом</li>
          <li>Не пытайся обойти ограничения системы</li>
        </ul>

        <h2 className="text-lg font-medium mt-6">4. Аккаунты</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Один человек — один аккаунт</li>
          <li>Нельзя продавать или передавать аккаунты</li>
          <li>Администрация может заблокировать аккаунт за нарушение правил</li>
        </ul>

        <h2 className="text-lg font-medium mt-6">5. CharacterLab+</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Подписка не подлежит возврату после активации</li>
          <li>Злоупотребление подпиской (перепродажа, шеринг) ведёт к блокировке</li>
        </ul>

        <div className="mt-8 rounded-lg border p-4 text-xs text-muted-foreground">
          Администрация оставляет за собой право изменять правила. Нарушение правил может привести к блокировке аккаунта без предупреждения.
        </div>
      </div>
    </div>
  );
}
