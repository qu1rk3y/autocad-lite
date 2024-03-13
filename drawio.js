import clipboard from "clipboardy";
import fs from "fs";
import inquirer from "inquirer";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// colour list for drawio: "556b2f", "191970", "ff4500", "ffd700", "00ff00", "00bfff", "0000ff", "ff1493"

let SocketTypes = {
  bnc: {
    colour: "#0000FF",
    name: "BNC",
  },
  ref: {
    colour: "#ffd700",
    name: "BNC",
  },
  hdmi: {
    colour: "#ff1493",
    name: "HDMI",
  },
  xlr: {
    colour: "#ff4500",
    name: "XLR",
  },
  rca: {
    colour: "#ff4500",
    name: "RCA",
  },
  rj45: {
    colour: "#00FF00",
    name: "RJ45",
  },
  jack: {
    colour: "#ff4500",
    name: "Jack",
  },
  minijack: {
    colour: "#ff4500",
    name: "Minijack",
  },
  de9: {
    colour: "#556b2f",
    name: "DE-9",
  },
  usb: {
    colour: "#556b2f",
    name: "USB",
  },
  ltcbnc: {
    colour: "#ff4500",
    name: "BNC",
  },
  vga: {
    colour: "#0000ff",
    name: "VGA",
  },
  lc: {
    colour: "#003300",
    name: "LC",
  },
};

(async () => {
  let paths = fs
    .readdirSync("devices", { recursive: true })
    .filter((x) => !x.includes("_") && x.includes(".json"));

  let devices = [];

  let files = await Promise.all(
    paths.map(async (x) => {
      let device = JSON.parse(
        await fs.promises.readFile(`${__dirname}/devices/${x}`)
      );
      devices.push({
        path: `${__dirname}/devices/${x}`,
        vendor: device.options.vendor,
        model: device.options.model,
      });
    })
  );

  devices.sort((a, b) => {
    return (
      a.vendor.toLowerCase().localeCompare(b.vendor.toLowerCase()) ||
      a.model.toLowerCase().localeCompare(b.model.toLowerCase())
    );
  });

  let selectedVendor = await inquirer.prompt([
    {
      type: "list",
      name: "vendor",
      message: "Pick a vendor",
      choices: [...new Set(devices.map((x) => x.vendor))],
    },
  ]);

  let selectedModel = await inquirer.prompt([
    {
      type: "list",
      name: "model",
      message: "Pick a model",
      choices: devices
        .filter((x) => x.vendor === selectedVendor.vendor)
        .map((x) => x.model),
    },
  ]);

  let selectedDevice = devices.filter(
    (x) => x.vendor === selectedVendor.vendor && x.model === selectedModel.model
  )[0];

  createShape(selectedDevice.path);
})();

function createShape(path) {
  let device = JSON.parse(fs.readFileSync(path));

  if (device.options?.compact) {
    createCompactShape(device);
  } else {
    createStandardShape(device);
  }
}

function createCompactShape(device) {
  const stemWidth = 25;

  let blockWidth = device.options?.width ? device.options.width : 120;
  let width = 2 * stemWidth + blockWidth;
  let height = 60;

  let backgroundPath = [
    `<move x="${stemWidth}" y="0" />`,
    `<line x="${stemWidth + blockWidth}" y="0" />`,
    `<line x="${stemWidth + blockWidth}" y="${height}" />`,
    `<line x="${stemWidth}" y="${height}" />`,
    `<close />`,
  ];
  let foregroundPath = [];
  let connections = [];
  let text = [];

  // add the placeholder text
  text.push(
    `<fontstyle style="1" />`,
    `<fontsize size="13" />`,
    `<text str="%title%" x="${
      width / 2
    }" y="11" align="center" valign="top" align-shape="1" fontstyle="1" placeholders="1" />`,
    `<fontstyle style="0" />`,
    `<fontsize size="8" />`,
    `<text str="${
      device.options?.placeholders
        ? "%model%"
        : `${device.options.vendor} ${device.options.model}`
    }" x="${
      width / 2
    }" y="30" align="center" valign="top" align-shape="1" placeholders="1" />`,
    `<fontsize size="10" />`,
    `<text str="%location%" x="${
      width / 2
    }" y="45" align="center" valign="top" align-shape="1" placeholders="1" />`,
    `<fontsize size="9" />`
  );

  if (device.inputs.length > 0) {
    let input = device.inputs[0];
    // add the wire connection points
    connections.push(`<constraint x="0" y="0.5" />`);

    // add the socket type text
    text.push(
      `<fontsize size="6" />`,
      `<fontcolor color="${SocketTypes[input.type].colour}" />`,
      `<text str="${SocketTypes[input.type].name}" x="${stemWidth - 2}" y="${
        height / 2 - 7
      }" align="right" valign="top" align-shape="1" />`,
      `<fontcolor color="#000000" />`
    );
    // draw the pin stem
    foregroundPath.push(
      `<strokecolor color="${SocketTypes[input.type].colour}" />`,
      `<path>`,
      `<move x="0" y="${height / 2}" />`,
      `<line x="${stemWidth - 0.5}" y="${height / 2}" />`,
      `</path>`,
      `<stroke />`,
      `<strokecolor color="#000000" />`
    );
  }

  if (device.outputs.length > 0) {
    let output = device.outputs[0];
    connections.push(`<constraint x="1" y="0.5" />`);

    text.push(
      `<fontsize size="6" />`,
      `<fontcolor color="${SocketTypes[output.type].colour}" />`,
      `<text str="${SocketTypes[output.type].name}" x="${
        stemWidth + blockWidth + 2
      }" y="${height / 2 - 7}" align="left" valign="top" align-shape="1" />`,
      `<fontcolor color="#000000" />`
    );
    foregroundPath.push(
      `<strokecolor color="${SocketTypes[output.type].colour}" />`,
      `<path>`,
      `<move x="${stemWidth + blockWidth + 0.5}" y="${height / 2}" />`,
      `<line x="${2 * stemWidth + blockWidth}" y="${height / 2}" />`,
      `</path>`,
      `<stroke />`,
      `<strokecolor color="#000000" />`
    );
  }

  let shape = `
<shape w="${width}" h="${height}" aspect="relative" strokewidth="inherit">
    <connections>
`;

  shape += connections.join(`\n`);

  shape += `
    </connections>
    <background>
        <path>
`;

  shape += backgroundPath.join(`\n`);

  shape += `
        </path>
    </background>
    <foreground>
        <fillstroke/>
`;

  shape += text.join(`\n`);
  shape += foregroundPath.join("\n");

  shape += `
    </foreground>
</shape>
`;

  clipboard.writeSync(shape);
  console.log(`copied to clipboard - width: ${width}, height: ${height}`);
}

function createStandardShape(device) {
  const pinOffset = 20;
  const stemWidth = 25;
  const headerHeight = 50;
  const footerHeight = 40;

  let blockWidth = device.options?.width ? device.options.width : 150;
  let width = 2 * stemWidth + blockWidth;

  let maxPins = Math.max(device.inputs.length, device.outputs.length);
  let pinsHeight = pinOffset + maxPins * pinOffset;

  let height = headerHeight + pinsHeight + footerHeight;

  // draw the boxes
  let backgroundPath = [
    `<move x="${stemWidth}" y="0" />`,
    `<line x="${stemWidth + blockWidth}" y="0" />`,
    `<line x="${stemWidth + blockWidth}" y="${headerHeight}" />`,
    `<line x="${stemWidth}" y="${headerHeight}" />`,
    `<close />`,
    `<move x="${stemWidth}" y="${headerHeight}" />`,
    `<line x="${stemWidth + blockWidth}" y="${headerHeight}" />`,
    `<line x="${stemWidth + blockWidth}" y="${headerHeight + pinsHeight}" />`,
    `<line x="${stemWidth}" y="${headerHeight + pinsHeight}" />`,
    `<close />`,
    `<move x="${stemWidth}" y="${headerHeight + pinsHeight}" />`,
    `<line x="${stemWidth + blockWidth}" y="${headerHeight + pinsHeight}" />`,
    `<line x="${stemWidth + blockWidth}" y="${
      headerHeight + pinsHeight + footerHeight
    }" />`,
    `<line x="${stemWidth}" y="${headerHeight + pinsHeight + footerHeight}" />`,
    `<close />`,
  ];
  let foregroundPath = [];
  let connections = [];
  let text = [];

  // add the placeholder text
  text.push(
    `<fontstyle style="1" />`,
    `<fontsize size="13" />`,
    `<text str="%title%" x="${
      width / 2
    }" y="11" align="center" valign="top" align-shape="1" fontstyle="1" placeholders="1" />`,
    `<fontstyle style="0" />`,
    `<fontsize size="8" />`,
    `<text str="${
      device.options?.placeholders ? "%vendor%" : device.options.vendor
    }" x="${
      width / 2
    }" y="30" align="center" valign="top" align-shape="1" placeholders="1" />`,
    `<text str="${
      device.options?.placeholders ? "%model%" : device.options.model
    }" x="${
      width / 2
    }" y="39" align="center" valign="top" align-shape="1" placeholders="1" />`,
    `<fontsize size="10" />`,
    `<text str="%ip%" x="${width / 2}" y="${
      headerHeight + pinsHeight + 8
    }" align="center" valign="top" align-shape="1" placeholders="1" />`,
    `<text str="%location%" x="${width / 2}" y="${
      headerHeight + pinsHeight + 22
    }" align="center" valign="top" align-shape="1" placeholders="1" />`,
    `<fontsize size="9" />`
  );

  for (let i = 0; i < device.inputs.length; i++) {
    let input = device.inputs[i];
    let yPosRel = (i + 1) / (maxPins + 1);

    // add the wire connection points
    connections.push(
      `<constraint x="0" y="${
        yPosRel * (pinsHeight / height) + headerHeight / height
      }" />`
    );
    // add the input name text
    text.push(
      `<fontsize size="9" />`,
      `<text str="${input.name}" x="${stemWidth + 5}" y="${
        headerHeight + pinsHeight * yPosRel - 5
      }" align="left" valign="top" align-shape="1" />`
    );

    // add the socket type text
    text.push(
      `<fontsize size="6" />`,
      `<fontcolor color="${SocketTypes[input.type].colour}" />`,
      `<text str="${SocketTypes[input.type].name}" x="${stemWidth - 2}" y="${
        headerHeight + pinsHeight * yPosRel - 7
      }" align="right" valign="top" align-shape="1" />`,
      `<fontcolor color="#000000" />`
    );
    // draw the pin stem
    foregroundPath.push(
      `<strokecolor color="${SocketTypes[input.type].colour}" />`,
      `<path>`,
      `<move x="0" y="${headerHeight + pinsHeight * yPosRel}" />`,
      `<line x="${stemWidth - 0.5}" y="${
        headerHeight + pinsHeight * yPosRel
      }" />`,
      `</path>`,
      `<stroke />`,
      `<strokecolor color="#000000" />`
    );
  }

  for (let i = 0; i < device.outputs.length; i++) {
    let output = device.outputs[i];
    let yPosRel = (i + 1) / (maxPins + 1);
    connections.push(
      `<constraint x="1" y="${
        yPosRel * (pinsHeight / height) + headerHeight / height
      }" />`
    );
    text.push(
      `<fontsize size="9" />`,
      `<text str="${output.name}" x="${width - stemWidth - 5}" y="${
        headerHeight + pinsHeight * yPosRel - 5
      }" align="right" valign="top" align-shape="1" />`
    );

    text.push(
      `<fontsize size="6" />`,
      `<fontcolor color="${SocketTypes[output.type].colour}" />`,
      `<text str="${SocketTypes[output.type].name}" x="${
        stemWidth + blockWidth + 2
      }" y="${
        headerHeight + pinsHeight * yPosRel - 7
      }" align="left" valign="top" align-shape="1" />`,
      `<fontcolor color="#000000" />`
    );
    foregroundPath.push(
      `<strokecolor color="${SocketTypes[output.type].colour}" />`,
      `<path>`,
      `<move x="${stemWidth + blockWidth + 0.5}" y="${
        headerHeight + pinsHeight * yPosRel
      }" />`,
      `<line x="${2 * stemWidth + blockWidth}" y="${
        headerHeight + pinsHeight * yPosRel
      }" />`,
      `</path>`,
      `<stroke />`,
      `<strokecolor color="#000000" />`
    );
  }

  let shape = `
<shape w="${width}" h="${height}" aspect="relative" strokewidth="inherit">
    <connections>
`;

  shape += connections.join(`\n`);

  shape += `
    </connections>
    <background>
        <path>
`;

  shape += backgroundPath.join(`\n`);

  shape += `
        </path>
    </background>
    <foreground>
        <fillstroke/>
`;

  shape += text.join(`\n`);
  shape += foregroundPath.join("\n");

  shape += `
    </foreground>
</shape>
`;

  clipboard.writeSync(shape);
  console.log(`copied to clipboard - width: ${width}, height: ${height}`);
}
