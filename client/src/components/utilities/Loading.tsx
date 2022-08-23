import '../styles/Loading.css'

export const Loading = () => {
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

export const Success = () => {
    return (
        <img style={{width: "100px", height: "100px"}} alt='success' src='/success.gif'/>
    )
}

export const Failure = () => {
    return (
        <img style={{width: "100px", height: "100px"}} alt='failure' src='/failure.gif'/>
    )
}