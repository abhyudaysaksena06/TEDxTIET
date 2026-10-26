import { asset } from "../lib/basePath";

/**
 * The 2026 team.
 *
 * Lives outside the Team page so the navigation can count it without pulling
 * the page itself into the main bundle. The menu's "N students" used to be
 * typed by hand and stayed at 38 after members were removed.
 *
 * Board and committee each render as two desktop columns, with the right one
 * staggered half a row down. Keep the columns level, with any odd name on the
 * left, so the zig-zag closes evenly instead of one side trailing.
 */

export const BOARD_LEFT = [
  { name: "ROHAN SHARMA", role: "Lead Organizer", image: asset("/ExecutiveBoard/ROHANSHARMA.webp"), side: 'left' },
  { name: "SHARDOOL", role: "CO LEAD ORGANISER", image: asset("/ExecutiveBoard/SHRADOOL.webp"), side: 'left' },
  { name: "SANYA RAJPUT", role: "EVENTS AND OUTREACH HEAD", image: asset("/ExecutiveBoard/SANYARAJPUT.webp"), side: 'left' },
  { name: "SURYA PRATAP SINGH", role: "OPERATIONS AND MEDIA HEAD", image: asset("/ExecutiveBoard/SURYAPRATAPSINGH.webp"), side: 'left' },
  { name: "DISHA VERMA", role: "EXPERIENCE HEAD", image: asset("/ExecutiveBoard/DISHAVERMA.webp"), side: 'left' },
];

export const BOARD_RIGHT = [
  { name: "POORVA PURI", role: "CO LEAD ORGANISER", image: asset("/ExecutiveBoard/POORVAPURI.webp"), side: 'right' },
  { name: "ANIKET GUPTA", role: "RELATIONS AND STRATEGY HEAD", image: asset("/ExecutiveBoard/ANIKETGUPTA.webp"), side: 'right' },
  { name: "AANYA GARG", role: "MARKETING HEAD", image: asset("/ExecutiveBoard/AANYAGARG.webp"), side: 'right' },
  { name: "DAKSH SACHDEVA", role: "DESIGN HEAD", image: asset("/ExecutiveBoard/DAKSHSACHDEVA.webp"), side: 'right' },
  { name: "VRINDA CHHABRA", role: "CURATION HEAD", image: asset("/ExecutiveBoard/VRINDACHHABRA.webp"), side: 'right' },
];

export const COMMITTEE_LEFT = [
  { name: "RAJAT VERMA", side: 'left', image: asset("/ExecutiveCommittee/RAJAT.webp") },
  { name: "Kuwar Kalra", side: 'left', image: asset("/ExecutiveCommittee/KUWAR.webp") },
  { name: "Shreya Sarin", side: 'left', image: asset("/ExecutiveCommittee/SHREYA.webp") },
  { name: "Rhytham Gupta", side: 'left', image: asset("/ExecutiveCommittee/RHYTHAM.webp") },
  { name: "Arav Panchhi Chaturvedi", side: 'left', image: asset("/ExecutiveCommittee/AARAV.webp") },
  { name: "Hardaksh Sabharwal", side: 'left', image: asset("/ExecutiveCommittee/HARDAKSH.webp") },
  { name: "Khusboo Gaur", side: 'left', image: asset("/ExecutiveCommittee/KHUSBOO.webp") },
  { name: "Raghu Raja", side: 'left', image: asset("/ExecutiveCommittee/RAGHU.webp") },
  { name: "Jatin Bansal", side: 'left', image: asset("/ExecutiveCommittee/JATIN.webp") },
  { name: "Nakul Garg", side: 'left', image: asset("/ExecutiveCommittee/NAKUL.webp") },
  { name: "Harkirat Singh", side: 'left', image: asset("/ExecutiveCommittee/HARKIRAT.webp") },
];

export const COMMITTEE_RIGHT = [
  { name: "KANAN MAHAJAN", side: 'right', image: asset("/ExecutiveCommittee/KANAN.webp") },
  { name: "Samaira Nayyar", side: 'right', image: asset("/ExecutiveCommittee/SAMAIRA.webp") },
  { name: "Utkarsh Uppal", side: 'right', image: asset("/ExecutiveCommittee/UTKARSH.webp") },
  { name: "Hardik Jain", side: 'right', image: asset("/ExecutiveCommittee/HARDIK.webp") },
  { name: "Bhavyadeep Singh", side: 'right', image: asset("/ExecutiveCommittee/BHAVYA.webp") },
  { name: "Ridhi Batra", side: 'right', image: asset("/ExecutiveCommittee/RIDHI.webp") },
  { name: "Kartik Goyal", side: 'right', image: asset("/ExecutiveCommittee/KARTIK.webp") },
  { name: "Ayush Mathur", side: 'right', image: asset("/ExecutiveCommittee/AYUSH.webp") },
  { name: "Shashank Jain", side: 'right', image: asset("/ExecutiveCommittee/SHASHANK.webp") },
  { name: "Aaditi Singh", side: 'right', image: asset("/ExecutiveCommittee/AADITI.webp") },
];

export const TEAM_COUNT =
  BOARD_LEFT.length + BOARD_RIGHT.length + COMMITTEE_LEFT.length + COMMITTEE_RIGHT.length;
