import { ReactElement } from "react"

export type DropdownOption = {
    label: ReactElement<any, any>,
    value: number,
    search: string
}