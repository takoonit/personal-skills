declare module '@nestjs/common' {
  export const Controller: (p?: string) => ClassDecorator
  export const Injectable: () => ClassDecorator
  export const Get: (p?: string) => MethodDecorator
  export const Param: (p: string) => ParameterDecorator
  export class NotFoundException extends Error { constructor(m?: string) }
}
