"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Crown, Calendar, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CharacterCard } from "@/components/character-card";
import { TitleBadge } from "@/components/title-badge";
import { initials, formatDate } from "@/lib/utils";

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["user-profile", params.username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${params.username}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-10">
        <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="container max-w-3xl py-10 text-center text-muted-foreground">
        Пользователь не найден.
      </div>
    );
  }

  const { user, characters } = data;

  return (
    <div className="container max-w-3xl py-8">
      <Card className="overflow-hidden">
        {/* Баннер */}
        {user.bannerUrl ? (
          <div className="h-36 overflow-hidden">
            <img src={user.bannerUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-36 bg-gradient-to-br from-primary/30 via-primary/10 to-accent" />
        )}
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-14">
            <Avatar className="h-28 w-28 rounded-2xl border-4 border-background shadow-xl">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
              <AvatarFallback className="rounded-2xl text-3xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                {initials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-2 sm:pt-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user.username}</h1>
                {user.isPremium && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Crown className="h-3 w-3 mr-0.5" /> Plus
                  </Badge>
                )}
              </div>
              {/* Только активный титул */}
              {user.activeTitle && (
                <div className="mt-1">
                  {(() => {
                    const t = user.titles?.find((t: any) => t.name === user.activeTitle);
                    return t ? <TitleBadge name={t.name} color={t.color} /> : null;
                  })()}
                </div>
              )}
              {user.bio && (
                <p className="mt-3 text-muted-foreground">{user.bio}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {formatDate(user.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {user.characterCount} персонажей
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {characters.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Персонажи</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {characters.map((c: any) => (
              <CharacterCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      )}

      {characters.length === 0 && (
        <div className="mt-8 rounded-2xl border-2 border-dashed p-10 text-center text-muted-foreground">
          У этого пользователя пока нет публичных персонажей.
        </div>
      )}
    </div>
  );
}
