import decompressTar from "@xingrz/decompress-tar"
import { File } from "@xingrz/decompress-types"
import fetch from "node-fetch"
import { parseRules } from "parseRules"
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

function throwExpr(error: Error): never {
  throw error
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
    backward:
      files.find(file => file.path === "backward") || throwExpr(new Error("backward file with old links is missing")),
    backzone:
      files.find(file => file.path === "backzone") || throwExpr(new Error("backzone file with old rules is missing")),
    leapSeconds:
      files.find(file => file.path === "leap-seconds.list") || throwExpr(new Error("leap-seconds.list is missing")),
    countryCodes:
      files.find(file => file.path === "iso3166.tab") ||
      throwExpr(new Error("iso3166.tab file with countrycodes is missing")),
    zoneInfo:
      files.find(file => file.path === "zone1970.tab") ||
      throwExpr(new Error("zone1970.tab file with info about zones is missing")),
  }

  if (organizedFiles.ruleFiles.filter(file => !!file?.data).length !== ruleFilesNames.length) {
    throw new Error(
      `Some rule files are missing from the archive.
       Got:     [${organizedFiles.ruleFiles
         .filter(file => !!file?.data)
         .map(file => file.path)
         .sort()
         .join(", ")}]
       Expected: [${ruleFilesNames.sort().join(", ")}]`
    )
  }

  return organizedFiles as NonNullable<typeof organizedFiles>
}

const files = await obtainFiles("https://data.iana.org/time-zones/releases/tzdata2021e.tar.gz")
const organizedFiles = organizeFiles(files)

console.log(parseRules(organizedFiles.ruleFiles[0].data!))
