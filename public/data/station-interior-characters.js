import { stationEmployeeArt } from "./station-employee-art.js";
// Tight alpha bounds in the production atlas; seated feet remain on the bench.
export const stationCharacterArt = {
  "station-clerk": {"sheet":"stationClerk","x":248,"y":62,"w":535,"h":1438},
  "station-security": stationEmployeeArt[1],
  "station-security-guide": stationEmployeeArt[0],
  "station-security-desk": stationEmployeeArt[2],
  "station-reader": {"sheet":"stationReaderSeated","x":194,"y":120,"w":694,"h":1335},
  "waiting-person-0": {"sheet":"waitingPeople","x":75,"y":19,"w":369,"h":495},
  "waiting-person-1": {"sheet":"waitingPeople","x":548,"y":12,"w":360,"h":505},
  "waiting-person-2": {"sheet":"waitingPeople","x":1071,"y":23,"w":365,"h":494},
  "waiting-person-3": {"sheet":"waitingPeople","x":43,"y":517,"w":416,"h":491},
  "waiting-person-4": {"sheet":"waitingPeople","x":571,"y":526,"w":345,"h":484},
  "waiting-person-5": {"sheet":"waitingPeople","x":1038,"y":518,"w":406,"h":491},
  "waiting-person-6": {"sheet":"waitingCompanions","x":90,"y":100,"w":397,"h":679},
  "waiting-person-7": {"sheet":"waitingCompanions","x":589,"y":39,"w":362,"h":745},
  "waiting-person-8": {"sheet":"waitingCompanions","x":103,"y":828,"w":341,"h":672},
  "waiting-person-9": {"sheet":"waitingCompanions","x":572,"y":794,"w":349,"h":718},
};
