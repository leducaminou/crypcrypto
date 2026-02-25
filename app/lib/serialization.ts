// app/lib/serialization.ts
export const sanitizePrismaData = <T>(data: T): T => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString() as any;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizePrismaData) as any;
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = sanitizePrismaData(data[key]);
    }
    return result;
  }

  return data;
};