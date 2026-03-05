import styles from './page.module.css'


function List(props) {
    if (!props.animals) {
        return <div>Loading...</div>
    }

    if (props.animals.length === 0) {
        return <div>There are no animals in the list!</div>
    }

    return (
        <ul>
            {props.animals.map((animal) => {
                return <li key={animal}>{animal}</li>
            })}
        </ul>
    )
}

export default function App() {
    const animals = ["Lion", "Cow", "Snake", "Lizard"];

    return (
        <div>
            <h1>Animals: </h1>
            <List animals={animals} />
        </div>
    )
}