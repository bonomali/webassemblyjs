// @flow

import constants from "@webassemblyjs/helper-wasm-bytecode";
import * as leb from "@webassemblyjs/helper-leb128";

function assertNotIdentifierNode(n: Node) {
  if (n.type === "Identifier") {
    throw new Error("Unsupported node Identifier");
  }
}

export function encodeVersion(v: number): Array<Byte> {
  const bytes = constants.moduleVersion;
  bytes[0] = v;

  return bytes;
}

export function encodeHeader(): Array<Byte> {
  return constants.magicModuleHeader;
}

export function encodeU32(v: number): Array<Byte> {
  const uint8view = new Uint8Array(leb.encodeU32(v));
  const array = [...uint8view];
  return array;
}

export function encodeVec(elements: Array<Byte>): Array<Byte> {
  const size = elements.length;
  return [size, ...elements];
}

export function encodeValtype(v: Valtype): Byte {
  const byte = constants.valtypesByString[v];

  if (typeof byte === "undefined") {
    throw new Error("Unknown valtype: " + v);
  }

  return parseInt(byte, 10);
}

export function encodeMutability(v: Mutability): Byte {
  const byte = constants.globalTypesByString[v];

  if (typeof byte === "undefined") {
    throw new Error("Unknown mutability: " + v);
  }

  return parseInt(byte, 10);
}

export function encodeUTF8Vec(str: string): Array<Byte> {
  const charCodes = str.split("").map(x => x.charCodeAt(0));

  return encodeVec(charCodes);
}

export function encodeModuleImport(n: ModuleImport): Array<Byte> {
  const out = [];

  out.push(...encodeUTF8Vec(n.module));
  out.push(...encodeUTF8Vec(n.name));

  switch (n.descr.type) {
    case "GlobalType": {
      out.push(0x03);

      // $FlowIgnore: GlobalType ensure that these props exists
      out.push(encodeValtype(n.descr.valtype));
      // $FlowIgnore: GlobalType ensure that these props exists
      out.push(encodeMutability(n.descr.mutability));
      break;
    }

    case "Memory": {
      out.push(0x02);

      // $FlowIgnore: Memory ensure that these props exists
      if (typeof n.descr.limits.max === "number") {
        out.push(0x01);

        // $FlowIgnore: Memory ensure that these props exists
        out.push(...encodeU32(n.descr.limits.min));
        // $FlowIgnore: Memory ensure that these props exists
        out.push(...encodeU32(n.descr.limits.max));
      } else {
        out.push(0x00);

        // $FlowIgnore: Memory ensure that these props exists
        out.push(...encodeU32(n.descr.limits.min));
      }
      break;
    }

    default:
      throw new Error(
        "Unsupport operation: encode module import of type: " + n.descr.type
      );
  }

  return out;
}

export function encodeSectionMetadata(n: SectionMetadata): Array<Byte> {
  const out = [];

  const sectionId = constants.sections[n.section];

  if (typeof sectionId === "undefined") {
    throw new Error("Unknown section: " + n.section);
  }

  if (n.section === "start") {
    /**
     * This is not implemented yet because it's a special case which
     * doesn't have a vector in its section.
     */
    throw new Error("Unsupported section encoding of type start");
  }

  out.push(sectionId);
  out.push(...encodeU32(n.size));
  out.push(...encodeU32(n.vectorOfSize));

  return out;
}

export function encodeCallInstruction(n: CallInstruction): Array<Byte> {
  const out = [];

  assertNotIdentifierNode(n.index);

  out.push(0x10);
  // $FlowIgnore
  out.push(...encodeU32(n.index.value));

  return out;
}

export function encodeModuleExport(n: ModuleExport): Array<Byte> {
  const out = [];

  assertNotIdentifierNode(n.descr.id);

  const exportTypeByteString = constants.exportTypesByName[n.descr.type];

  if (typeof exportTypeByteString === "undefined") {
    throw new Error("Unknown export of type: " + n.descr.type);
  }

  const exportTypeByte = parseInt(exportTypeByteString, 10);

  out.push(...encodeUTF8Vec(n.name));
  out.push(exportTypeByte);

  // $FlowIgnore
  out.push(...encodeU32(n.descr.id.value));

  return out;
}
