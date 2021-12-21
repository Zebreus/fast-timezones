import decompressTar from "@xingrz/decompress-tar"
import { File } from "@xingrz/decompress-types"
import fetch from "node-fetch"
import { unzipSync } from "zlib"

// @ts-expect-error: Weird fix
const decompress = decompressTar.default()

/** Download and extract the tzdata files */
async function obtainFiles(url: string) {
  if (!url.endsWith(".tar.gz")) {
    throw new Error("The URL does not seem to point to a tar.gz file")
  }
  const file = await fetch(url)
  const data = await file.arrayBuffer()
  const extractedBuffer = unzipSync(data)
  const files = await decompress(extractedBuffer)
  return files
}

/** Categorize the tzdata files and check everything is there */
function organizeFiles(files: File[]) {
  const ruleFilesNames = [
    "africa",
    "antarctica",
    "asia",
    "australasia",
    "etcetera",
    "europe",
    "factory",
    "northamerica",
    "southamerica",
  ]
  const organizedFiles = {
    ruleFiles: files.flatMap(file => (ruleFilesNames.includes(file.path) ? [file] : [])),
    backward: files.find(file => file.path === "backward"),
    backzone: files.find(file => file.path === "backzone"),
    leapSeconds: files.find(file => file.path === "leap-seconds.list"),
    countryCodes: files.find(file => file.path === "iso3166.tab"),
    zoneInfo: files.find(file => file.path === "zone1970.tab"),
  }

  if (organizedFiles.ruleFiles.length !== ruleFilesNames.length) {
    throw new Error(
      `Some rule files are missing from the archive.
       Got:     [${organizedFiles.ruleFiles
         .filter(file => !!file)
         .map(file => file.path)
         .sort()
         .join(", ")}]
       Expected: [${ruleFilesNames.sort().join(", ")}]`
    )
  }
  if (!organizedFiles.backward) {
    throw new Error("backward file with old links is missing")
  }
  if (!organizedFiles.backzone) {
    throw new Error("backzone file with old rules is missing")
  }
  if (!organizedFiles.leapSeconds) {
    throw new Error("leap-seconds.list is missing")
  }
  if (!organizedFiles.countryCodes) {
    throw new Error("iso3166.tab file with countrycodes is missing")
  }
  if (!organizedFiles.zoneInfo) {
    throw new Error("zone1970.tab file with info about zones is missing")
  }

  return organizedFiles
}

const files = await obtainFiles("https://data.iana.org/time-zones/releases/tzdata2021e.tar.gz")
const organizedFiles = organizeFiles(files)

console.log(files, organizedFiles)
