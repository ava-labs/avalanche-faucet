import '../styles/Loading.css'

export function Loading() {
    return (
        <div className = "col-3">
            <div className = "snippet" data-title=".dot-pulse">
                <div className = "stage">
                    <div className = "dot-pulse"></div>
                </div>
            </div>
        </div>
    )
}

export function Success() {
    return (
        <img style={{width: "100px", height: "100px"}} alt='success' src='/success.gif'/>
    )
}

export function Failure() {
    return (
        <img style={{width: "100px", height: "100px"}} alt='failure' src='/failure.gif'/>
    )
}