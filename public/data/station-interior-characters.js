import { stationEmployeeArt } from "./station-employee-art.js";
// Tight alpha bounds in the production atlas; seated feet remain on the bench.
export const stationCharacterArt = {
  // Render the actual popup person through a traced silhouette; no replacement
  // identity or separately generated portrait is introduced.
  "station-barista": {sheet:"stationCafePortrait",x:550,y:75,w:405,h:660,
    silhouette:[[671,81],[733,79],[783,104],[818,155],[836,214],[863,274],[852,337],[817,373],[865,394],[912,473],[941,660],[929,735],[582,735],[576,615],[587,492],[600,419],[627,382],[586,341],[555,277],[571,191],[607,126]]},
  "station-shopkeeper": {sheet:"stationSnackPortrait",x:485,y:90,w:475,h:660,
    silhouette:[[623,106],[704,91],[780,106],[829,139],[853,190],[851,274],[840,335],[807,390],[897,419],[924,487],[950,675],[945,750],[500,750],[486,631],[496,502],[536,434],[595,403],[558,345],[537,276],[548,208],[568,144]]},
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
