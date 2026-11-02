/**
 * Role based access control (rule 5 / section 2 of the guide).
 *
 * These checks run on the server. Hiding a dashboard element is never enough:
 * every API route calls one of these functions before returning data.
 */

export const ROLES = {
  COACH: 'coach',
  PLAYER: 'player',
  SCOUT: 'scout',
};

const key = (value) => (value === null || value === undefined ? '' : String(value));

/** Can this actor read this player's record at all? */
export function canViewPlayer(actor, target) {
  if (!actor) return false;
  const playerId = key(target?.playerId ?? target?.id);
  const isReady = target?.status === 'Ready' || target?.isReady === true;

  switch (actor.role) {
    case ROLES.COACH:
      return true;
    case ROLES.PLAYER:
      return Boolean(actor.playerId) && key(actor.playerId) === playerId;
    case ROLES.SCOUT:
      return isReady;
    default:
      return false;
  }
}

/** Which players may this actor see in a list? */
export function filterVisiblePlayers(actor, evaluatedPlayers) {
  if (!actor) return [];
  if (actor.role === ROLES.COACH) return evaluatedPlayers;
  if (actor.role === ROLES.PLAYER) {
    return evaluatedPlayers.filter((player) => key(player.id) === key(actor.playerId));
  }
  if (actor.role === ROLES.SCOUT) {
    return evaluatedPlayers.filter((player) => player.status === 'Ready');
  }
  return [];
}

/** Can this actor open the given area of the app? */
export function canOpenArea(actor, area) {
  if (!actor) return false;
  const allowed = {
    coach: [ROLES.COACH],
    player: [ROLES.PLAYER],
    scout: [ROLES.SCOUT],
  };
  return (allowed[area] || []).includes(actor.role);
}

/** Write permissions: only the coach manages the academy. */
export function canWrite(actor, resource) {
  if (!actor) return false;
  if (actor.role !== ROLES.COACH) return false;
  return ['players', 'sessions', 'attendance', 'matches', 'scores'].includes(resource);
}

/** Where should this actor land after login? */
export function homeForRole(role) {
  if (role === ROLES.COACH) return '/coach';
  if (role === ROLES.PLAYER) return '/player';
  if (role === ROLES.SCOUT) return '/scout';
  return '/login';
}

/**
 * Fields a scout is allowed to see. Scouts review eligible players only and do
 * not get contact details or account information.
 */
export function scoutView(player) {
  return {
    id: player.id,
    name: player.name,
    age: player.age,
    sport: player.sport,
    attendancePercent: player.attendancePercent,
    matchesPlayed: player.matchesPlayed,
    status: player.status,
  };
}
